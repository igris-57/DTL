# backend/app/routers/prediction.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import SimplifiedAssessmentRequest, PredictionResponse, RiskFactor, Recommendation, RawFeaturesRequest
from app.models.ml_model import ml_model
from app.database import get_db
from app.repositories.prediction_repository import save_prediction
from typing import List

# NOTE: FEATURE_ORDER must match the order used during model training.
# Keep this list in sync with backend/ml/train_model.py: FEATURE_COLUMNS
FEATURE_ORDER: List[str] = [
    'Curricular units 2nd sem (approved)',
    'Curricular units 1st sem (approved)',
    'Tuition fees up to date',
    'Scholarship holder',
    'Age at enrollment',
    'Debtor',
    'Gender',
    'Application mode'
]

router = APIRouter(prefix="/predict", tags=["prediction"])

def map_form_to_ml_features(data: SimplifiedAssessmentRequest) -> List[float]:
    """
    Map all form inputs to ML model's required features.
    ML Model expects: ['Curricular units 2nd sem (approved)', 'Curricular units 1st sem (approved)',
                       'Tuition fees up to date', 'Scholarship holder', 'Age at enrollment',
                       'Debtor', 'Gender', 'Application mode']
    """
    # Attendance maps to curricular units approved (study performance proxy)
    attendance_to_units = {
        'always': 50, 'often': 45, 'sometimes': 30, 'rarely': 15, 'never': 5
    }
    curricular_2nd_sem = attendance_to_units.get(data.attendance, 30)
    curricular_1st_sem = attendance_to_units.get(data.attendance, 30)
    
    # Performance satisfaction affects study units
    performance_factor = (data.performance_satisfaction / 10.0)
    curricular_2nd_sem = int(curricular_2nd_sem * performance_factor)
    curricular_1st_sem = int(curricular_1st_sem * performance_factor)
    
    # Tuition fees based on financial stress
    financial_stress_map = {'none': 1, 'low': 1, 'moderate': 0, 'high': 0, 'very-high': 0}
    tuition_fees_up_to_date = float(financial_stress_map.get(data.financial_stress, 0))
    
    # Scholarship holder based on financial stress
    scholarship_scores = {'none': 1, 'low': 1, 'moderate': 0, 'high': 0, 'very-high': 0}
    scholarship_holder = float(scholarship_scores.get(data.financial_stress, 0))
    
    # Age proxy based on academic year
    academic_year_map = {'1st': 18, '2nd': 19, '3rd': 20, '4th': 21}
    age_base = academic_year_map.get(data.academic_year, 19)
    
    # Adjust age based on employment
    employment_age_adjustment = {'not-employed': 0, 'part-time': 1, 'full-time': 2}
    age_at_enrollment = float(age_base + employment_age_adjustment.get(data.employment_status, 0))
    
    # Debtor status based on financial stress
    debtor_map = {'none': 0, 'low': 0, 'moderate': 1, 'high': 1, 'very-high': 1}
    debtor = float(debtor_map.get(data.financial_stress, 0))
    
    # Gender (1 for male, 0 for female) - use study hours as proxy
    if data.study_hours in ['8+', '5-8']:
        gender = 0  # Female tend to study more
    else:
        gender = 1
    
    # Application mode based on employment and career alignment
    if data.employment_status == 'full-time' and data.career_alignment < 5:
        application_mode = 2  # Alternative entry
    elif data.career_alignment >= 8:
        application_mode = 1  # Regular entry
    else:
        application_mode = 1
    
    return [
        curricular_2nd_sem,
        curricular_1st_sem,
        tuition_fees_up_to_date,
        scholarship_holder,
        age_at_enrollment,
        debtor,
        gender,
        application_mode
    ]

def calculate_fallback_risk(data: SimplifiedAssessmentRequest) -> PredictionResponse:
    """Fallback prediction when ML model is not available"""
    risk_score = 0

    # Attendance scoring
    attendance_scores = {
        'always': 0, 'often': 5, 'sometimes': 15, 'rarely': 25, 'never': 35
    }
    risk_score += attendance_scores.get(data.attendance, 0)

    # Overwhelm scoring
    overwhelm_scores = {
        'never': 0, 'rarely': 5, 'sometimes': 10, 'often': 20, 'always': 30
    }
    risk_score += overwhelm_scores.get(data.overwhelm_frequency, 0)

    # Financial stress scoring
    financial_scores = {
        'none': 0, 'low': 5, 'moderate': 10, 'high': 20, 'very-high': 25
    }
    risk_score += financial_scores.get(data.financial_stress, 0)

    # Withdrawal consideration
    if data.withdrawal_considered:
        risk_score += 15

    # Performance satisfaction (inverse)
    risk_score += max(0, 10 - data.performance_satisfaction) * 2

    # Advisor interaction (inverse - less interaction = higher risk)
    advisor_scores = {
        'never': 10, 'once-semester': 5, '2-3-semester': 2, 'monthly': 0
    }
    risk_score += advisor_scores.get(data.advisor_interaction, 0)
    
    # Support network strength (inverse - weaker = higher risk)
    risk_score += max(0, 10 - data.support_network_strength)
    
    # Extracurricular hours (too much or too little is risky)
    if data.extracurricular_hours < 1 or data.extracurricular_hours > 15:
        risk_score += 5
    
    # Career alignment (poor alignment = higher risk)
    risk_score += max(0, 10 - data.career_alignment) * 1.5
    
    # Employment status (full-time while studying increases risk)
    if data.employment_status == 'full-time':
        risk_score += 10
    elif data.employment_status == 'part-time':
        risk_score += 5

    # Normalize to 0-100
    risk_score = min(100, max(0, risk_score))

    # Determine risk level
    if risk_score >= 60:
        risk_level = 'high'
    elif risk_score >= 35:
        risk_level = 'medium'
    else:
        risk_level = 'low'

    # Generate risk factors
    risk_factors = []
    if data.attendance in ['rarely', 'never']:
        risk_factors.append(RiskFactor(
            category="Academic",
            factor="Low Class Attendance",
            impact="high",
            description="Inconsistent class attendance is strongly correlated with dropout risk"
        ))

    if data.overwhelm_frequency in ['often', 'always']:
        risk_factors.append(RiskFactor(
            category="Mental Health",
            factor="Academic Overwhelm",
            impact="high",
            description="Feeling frequently overwhelmed can lead to burnout and withdrawal"
        ))

    if data.financial_stress in ['high', 'very-high']:
        risk_factors.append(RiskFactor(
            category="Financial",
            factor="Financial Stress",
            impact="high",
            description="Financial difficulties are a leading cause of student withdrawal"
        ))

    if data.withdrawal_considered:
        risk_factors.append(RiskFactor(
            category="Behavioral",
            factor="Withdrawal Consideration",
            impact="high",
            description="Active consideration of withdrawal indicates elevated risk"
        ))

    # Generate recommendations
    recommendations = []
    if risk_level == 'high':
        recommendations.append(Recommendation(
            type="counseling",
            title="Mental Health Support",
            description="Schedule an urgent appointment with a counselor to discuss your concerns and develop a support plan",
            urgency="immediate",
            contact="counseling@rvce.edu.in"
        ))

    if data.financial_stress in ['high', 'very-high']:
        recommendations.append(Recommendation(
            type="financial",
            title="Financial Aid Office",
            description="Connect with financial aid office to explore scholarships, grants, and emergency funding options",
            urgency="soon",
            contact="financialaid@rvce.edu.in"
        ))

    if data.performance_satisfaction <= 4:
        recommendations.append(Recommendation(
            type="academic",
            title="Academic Tutoring",
            description="Access tutoring services and study groups to improve academic performance",
            urgency="soon",
            contact="tutoring@rvce.edu.in"
        ))
    
    # Services used - if no services used, add recommendation
    if not data.services_used or len(data.services_used) == 0:
        recommendations.append(Recommendation(
            type="support",
            title="Explore Campus Support Services",
            description="You haven't indicated using any support services yet. Visit the student center to learn about available resources including academic advising, counseling, and health services.",
            urgency="soon",
            contact="studentcenter@rvce.edu.in"
        ))

    if not recommendations:
        recommendations.append(Recommendation(
            type="peer",
            title="Stay Connected",
            description="Continue engaging with campus resources and maintain your support network",
            urgency="when-needed"
        ))

    return PredictionResponse(
        risk_level=risk_level,
        risk_score=risk_score,
        dropout_probability=risk_score / 100,
        risk_factors=risk_factors,
        recommendations=recommendations,
        prediction_confidence=0.75
    )

@router.post("/simplified", response_model=PredictionResponse)
async def predict_simplified(data: SimplifiedAssessmentRequest, db: AsyncSession = Depends(get_db)):
    """
    Predict dropout risk based on simplified assessment.
    Uses ML model if available, falls back to heuristic otherwise.
    All form inputs are used in the prediction.
    """
    try:
        # Map all form inputs to ML features
        ml_features = map_form_to_ml_features(data)
        
        # Try to use ML model first
        if ml_model.is_loaded:
            pred = ml_model.predict(ml_features)
            if pred is not None:
                dropout_probability = pred['dropout_probability']
                predicted_class = pred['predicted_class']
                prediction_confidence = pred['model_confidence']
                
                # Determine risk level based on probability
                risk_score = int(round(dropout_probability * 100))
                if dropout_probability >= 0.6:
                    risk_level = 'high'
                elif dropout_probability >= 0.35:
                    risk_level = 'medium'
                else:
                    risk_level = 'low'
                
                # Generate risk factors based on form inputs
                risk_factors = []
                if data.attendance in ['rarely', 'never']:
                    risk_factors.append(RiskFactor(
                        category="Academic",
                        factor="Low Class Attendance",
                        impact="high",
                        description="Inconsistent class attendance is strongly correlated with dropout risk"
                    ))
                
                if data.overwhelm_frequency in ['often', 'always']:
                    risk_factors.append(RiskFactor(
                        category="Mental Health",
                        factor="Academic Overwhelm",
                        impact="high",
                        description="Feeling frequently overwhelmed can lead to burnout and withdrawal"
                    ))
                
                if data.financial_stress in ['high', 'very-high']:
                    risk_factors.append(RiskFactor(
                        category="Financial",
                        factor="Financial Stress",
                        impact="high",
                        description="Financial difficulties are a leading cause of student withdrawal"
                    ))
                
                if data.withdrawal_considered:
                    risk_factors.append(RiskFactor(
                        category="Behavioral",
                        factor="Withdrawal Consideration",
                        impact="high",
                        description="Active consideration of withdrawal indicates elevated risk"
                    ))
                
                if data.support_network_strength <= 3:
                    risk_factors.append(RiskFactor(
                        category="Social",
                        factor="Weak Support Network",
                        impact="medium",
                        description="Limited social support increases vulnerability during challenges"
                    ))
                
                if data.employment_status == 'full-time':
                    risk_factors.append(RiskFactor(
                        category="Personal",
                        factor="Full-time Employment",
                        impact="medium",
                        description="Working full-time while studying significantly increases time pressure"
                    ))
                
                # Generate recommendations
                recommendations = []
                if risk_level == 'high':
                    recommendations.append(Recommendation(
                        type="counseling",
                        title="Mental Health Support",
                        description="Schedule an urgent appointment with a counselor to discuss your concerns and develop a support plan",
                        urgency="immediate",
                        contact="counseling@rvce.edu.in"
                    ))
                
                if data.financial_stress in ['high', 'very-high']:
                    recommendations.append(Recommendation(
                        type="financial",
                        title="Financial Aid Office",
                        description="Connect with financial aid office to explore scholarships, grants, and emergency funding options",
                        urgency="soon",
                        contact="financialaid@rvce.edu.in"
                    ))
                
                if data.performance_satisfaction <= 4:
                    recommendations.append(Recommendation(
                        type="academic",
                        title="Academic Tutoring",
                        description="Access tutoring services and study groups to improve academic performance",
                        urgency="soon",
                        contact="tutoring@rvce.edu.in"
                    ))
                
                if data.advisor_interaction in ['never', 'once-semester']:
                    recommendations.append(Recommendation(
                        type="academic",
                        title="Schedule Advisor Meeting",
                        description="Regular meetings with your academic advisor can help with course planning and early problem detection",
                        urgency="soon",
                        contact="advising@rvce.edu.in"
                    ))
                
                if data.employment_status == 'full-time':
                    recommendations.append(Recommendation(
                        type="peer",
                        title="Time Management Support",
                        description="Consider reducing work hours or exploring flexible work arrangements to prioritize your studies",
                        urgency="soon"
                    ))
                
                # Handle withdrawal reasons if withdrawal is considered
                if data.withdrawal_considered and data.withdrawal_reasons:
                    withdrawal_reason_map = {
                        'Academic difficulty': {
                            'recommendation': Recommendation(
                                type="academic",
                                title="Academic Support Program",
                                description="Enroll in our comprehensive academic support program with tutoring, study groups, and study skills workshops",
                                urgency="immediate",
                                contact="academicsupport@rvce.edu.in"
                            ),
                            'risk_factor': RiskFactor(
                                category="Academic",
                                factor="Academic Difficulty",
                                impact="high",
                                description="Struggling with academic material can lead to course failure and withdrawal"
                            )
                        },
                        'Financial challenges': {
                            'recommendation': Recommendation(
                                type="financial",
                                title="Emergency Financial Assistance",
                                description="Apply for emergency grants or loans. Meet with financial counselor to create a sustainable plan",
                                urgency="immediate",
                                contact="financialaid@rvce.edu.in"
                            ),
                            'risk_factor': RiskFactor(
                                category="Financial",
                                factor="Financial Crisis",
                                impact="high",
                                description="Severe financial issues are a primary driver of student withdrawal"
                            )
                        },
                        'Mental health': {
                            'recommendation': Recommendation(
                                type="counseling",
                                title="Mental Health Crisis Support",
                                description="Contact counseling center immediately. We also have peer support groups and crisis resources available",
                                urgency="immediate",
                                contact="counseling@rvce.edu.in"
                            ),
                            'risk_factor': RiskFactor(
                                category="Mental Health",
                                factor="Mental Health Crisis",
                                impact="high",
                                description="Mental health challenges require immediate professional support and intervention"
                            )
                        },
                        'Personal/family issues': {
                            'recommendation': Recommendation(
                                type="support",
                                title="Personal Counseling & Family Support",
                                description="Our counselors can help you navigate personal and family challenges while maintaining your academic progress",
                                urgency="soon",
                                contact="counseling@rvce.edu.in"
                            ),
                            'risk_factor': RiskFactor(
                                category="Personal",
                                factor="Personal/Family Crisis",
                                impact="high",
                                description="Personal and family issues can significantly impact academic focus and commitment"
                            )
                        },
                        'Lack of interest': {
                            'recommendation': Recommendation(
                                type="academic",
                                title="Academic Advising & Program Exploration",
                                description="Meet with academic advisor to explore program alternatives, course selections, or potential major changes",
                                urgency="soon",
                                contact="advising@rvce.edu.in"
                            ),
                            'risk_factor': RiskFactor(
                                category="Academic",
                                factor="Loss of Academic Interest",
                                impact="high",
                                description="Declining interest in studies suggests misalignment with chosen program or career path"
                            )
                        },
                        'Career opportunities': {
                            'recommendation': Recommendation(
                                type="career",
                                title="Career Planning & Education Strategy",
                                description="Explore how to balance career opportunities with completing your degree. Many students pursue internships while studying",
                                urgency="soon",
                                contact="career@rvce.edu.in"
                            ),
                            'risk_factor': RiskFactor(
                                category="Career",
                                factor="Career Path Conflict",
                                impact="medium",
                                description="External career opportunities may be pulling focus away from academic commitments"
                            )
                        }
                    }
                    
                    for reason in data.withdrawal_reasons:
                        if reason in withdrawal_reason_map:
                            recommendations.append(withdrawal_reason_map[reason]['recommendation'])
                            risk_factors.append(withdrawal_reason_map[reason]['risk_factor'])
                
                # Services used - if no services used, add recommendation
                if not data.services_used or len(data.services_used) == 0:
                    recommendations.append(Recommendation(
                        type="support",
                        title="Explore Campus Support Services",
                        description="You haven't indicated using any support services yet. Visit the student center to learn about available resources including academic advising, counseling, and health services.",
                        urgency="soon",
                        contact="studentcenter@rvce.edu.in"
                    ))
                
                if not recommendations:
                    recommendations.append(Recommendation(
                        type="peer",
                        title="Stay Connected",
                        description="Continue engaging with campus resources and maintain your support network",
                        urgency="when-needed"
                    ))

                result = PredictionResponse(
                    risk_level=risk_level,
                    risk_score=risk_score,
                    dropout_probability=dropout_probability,
                    predicted_class=predicted_class,
                    risk_factors=risk_factors,
                    recommendations=recommendations,
                    prediction_confidence=prediction_confidence
                )

                # Save prediction to database (non-blocking, log errors)
                try:
                    await save_prediction(db, result, data, endpoint="simplified")
                except Exception as db_error:
                    print(f"Database save failed: {db_error}")

                return result

        # Fall back to heuristic if ML model not available
        result = calculate_fallback_risk(data)

        # Save fallback prediction to database
        try:
            await save_prediction(db, result, data, endpoint="simplified")
        except Exception as db_error:
            print(f"Database save failed: {db_error}")

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/raw", response_model=PredictionResponse)
async def predict_raw(request: RawFeaturesRequest, db: AsyncSession = Depends(get_db)):
    """Predict using raw feature dictionary matching training FEATURE_ORDER.

    Example request body:
      {"features": {"Curricular units 2nd sem (approved)": 3, ...}}
    """
    try:
        if not ml_model.is_loaded:
            raise HTTPException(status_code=503, detail="ML model not loaded")

        features_dict = request.features
        # Validate presence of all required features
        missing = [f for f in FEATURE_ORDER if f not in features_dict]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing feature keys: {missing}")

        # Build feature vector in the correct order
        feature_vector = [features_dict[f] for f in FEATURE_ORDER]

        pred = ml_model.predict(feature_vector)
        if pred is None:
            raise HTTPException(status_code=500, detail="Model prediction failed")

        dropout_probability = pred['dropout_probability']
        predicted_class = pred['predicted_class']
        model_confidence = pred['model_confidence']

        # Determine risk level based on probability
        risk_score = int(round(dropout_probability * 100))
        if dropout_probability >= 0.6:
            risk_level = 'high'
        elif dropout_probability >= 0.35:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        # Create prediction response
        result = PredictionResponse(
            risk_level=risk_level,
            risk_score=risk_score,
            dropout_probability=dropout_probability,
            predicted_class=predicted_class,
            risk_factors=[],  # No heuristic factors for raw ML prediction
            recommendations=[], # To be expanded in future versions
            prediction_confidence=model_confidence
        )

        # Save to database (without assessment input for raw endpoint)
        try:
            await save_prediction(db, result, None, endpoint="raw")
        except Exception as db_error:
            print(f"Database save failed: {db_error}")

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
