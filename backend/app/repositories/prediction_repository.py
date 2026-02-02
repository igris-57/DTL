# backend/app/repositories/prediction_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, and_
from app.database import Prediction, AssessmentInput, RiskFactor, Recommendation
from app.models.schemas import PredictionResponse, SimplifiedAssessmentRequest
from datetime import datetime, timedelta
import json
from typing import Optional, List, Dict


async def save_prediction(
    db: AsyncSession,
    prediction: PredictionResponse,
    assessment_input: Optional[SimplifiedAssessmentRequest] = None,
    endpoint: str = "simplified"
) -> int:
    """
    Save prediction with all related data in a transaction.
    Returns the prediction ID.
    """
    try:
        # 1. Insert prediction
        new_prediction = Prediction(
            risk_level=prediction.risk_level,
            risk_score=prediction.risk_score,
            dropout_probability=prediction.dropout_probability,
            predicted_class=prediction.predicted_class if prediction.predicted_class else None,
            prediction_confidence=prediction.prediction_confidence,
            endpoint=endpoint,
            created_at=datetime.utcnow()
        )
        db.add(new_prediction)
        await db.flush()  # Get the prediction ID

        prediction_id = new_prediction.id

        # 2. Insert assessment inputs (if provided)
        if assessment_input:
            new_assessment = AssessmentInput(
                prediction_id=prediction_id,
                consent_given=assessment_input.consent_given,
                consent_data_processing=assessment_input.consent_data_processing,
                consent_anonymous_analytics=assessment_input.consent_anonymous_analytics,
                academic_year=assessment_input.academic_year,
                attendance=assessment_input.attendance,
                overwhelm_frequency=assessment_input.overwhelm_frequency,
                study_hours=assessment_input.study_hours,
                performance_satisfaction=assessment_input.performance_satisfaction,
                advisor_interaction=assessment_input.advisor_interaction,
                support_network_strength=assessment_input.support_network_strength,
                extracurricular_hours=assessment_input.extracurricular_hours,
                employment_status=assessment_input.employment_status,
                financial_stress=assessment_input.financial_stress,
                career_alignment=assessment_input.career_alignment,
                services_used=json.dumps(assessment_input.services_used) if assessment_input.services_used else None,
                withdrawal_considered=assessment_input.withdrawal_considered,
                withdrawal_reasons=json.dumps(assessment_input.withdrawal_reasons) if assessment_input.withdrawal_reasons else None
            )
            db.add(new_assessment)

        # 3. Insert risk factors
        for risk_factor in prediction.risk_factors:
            new_risk_factor = RiskFactor(
                prediction_id=prediction_id,
                category=risk_factor.category,
                factor=risk_factor.factor,
                impact=risk_factor.impact,
                description=risk_factor.description
            )
            db.add(new_risk_factor)

        # 4. Insert recommendations
        for recommendation in prediction.recommendations:
            new_recommendation = Recommendation(
                prediction_id=prediction_id,
                rec_type=recommendation.type,
                title=recommendation.title,
                description=recommendation.description,
                urgency=recommendation.urgency,
                contact=recommendation.contact if recommendation.contact else None
            )
            db.add(new_recommendation)

        # Commit transaction
        await db.commit()
        return prediction_id

    except Exception as e:
        await db.rollback()
        print(f"Error saving prediction: {e}")
        raise


async def get_dashboard_stats(db: AsyncSession) -> Dict:
    """
    Calculate aggregated dashboard statistics.
    """
    query = select(
        func.count(Prediction.id).label('total'),
        func.sum(case((Prediction.risk_level == 'high', 1), else_=0)).label('high_count'),
        func.sum(case((Prediction.risk_level == 'medium', 1), else_=0)).label('medium_count'),
        func.sum(case((Prediction.risk_level == 'low', 1), else_=0)).label('low_count'),
        func.avg(Prediction.risk_score).label('avg_score')
    )

    result = await db.execute(query)
    row = result.first()

    total = row.total or 0
    high = row.high_count or 0
    medium = row.medium_count or 0
    low = row.low_count or 0

    return {
        'total_assessments': total,
        'high_risk_count': high,
        'medium_risk_count': medium,
        'low_risk_count': low,
        'high_risk_percentage': round((high / total * 100) if total > 0 else 0, 2),
        'medium_risk_percentage': round((medium / total * 100) if total > 0 else 0, 2),
        'low_risk_percentage': round((low / total * 100) if total > 0 else 0, 2),
        'average_risk_score': round(row.avg_score or 0, 1)
    }


async def get_risk_trends(db: AsyncSession, weeks: int = 8) -> List[Dict]:
    """
    Get risk counts grouped by week for trend chart.
    """
    start_date = datetime.utcnow() - timedelta(weeks=weeks)

    query = select(
        func.strftime('%Y-%W', Prediction.created_at).label('week_num'),
        Prediction.risk_level,
        func.count(Prediction.id).label('count')
    ).where(
        Prediction.created_at >= start_date
    ).group_by(
        'week_num', Prediction.risk_level
    ).order_by('week_num')

    result = await db.execute(query)
    rows = result.all()

    # Transform into chart format
    weekly_data = {}
    for row in rows:
        week_key = f"W{row.week_num.split('-')[1]}"  # Extract week number
        if week_key not in weekly_data:
            weekly_data[week_key] = {'week': week_key, 'high_risk': 0, 'medium_risk': 0, 'low_risk': 0}

        if row.risk_level == 'high':
            weekly_data[week_key]['high_risk'] = row.count
        elif row.risk_level == 'medium':
            weekly_data[week_key]['medium_risk'] = row.count
        else:
            weekly_data[week_key]['low_risk'] = row.count

    return list(weekly_data.values())


async def get_recent_assessments(db: AsyncSession, limit: int = 10) -> List[Dict]:
    """
    Get most recent predictions with basic information.
    """
    query = select(
        Prediction.id,
        Prediction.created_at,
        Prediction.risk_level,
        AssessmentInput.academic_year
    ).outerjoin(
        AssessmentInput, Prediction.id == AssessmentInput.prediction_id
    ).order_by(
        Prediction.created_at.desc()
    ).limit(limit)

    result = await db.execute(query)
    rows = result.all()

    assessments = []
    for row in rows:
        assessments.append({
            'id': row.id,
            'name': 'Student Assessment',  # Generic label for privacy
            'date': row.created_at.strftime('%a, %d %b'),
            'time': row.created_at.strftime('%I:%M %p'),
            'risk': row.risk_level,
            'type': f"Year {row.academic_year or 'N/A'} Review"
        })

    return assessments


async def get_top_risk_factors(db: AsyncSession, limit: int = 5) -> List[Dict]:
    """
    Get top risk factors by occurrence with trend calculation.
    """
    # Count factors by category
    query = select(
        RiskFactor.category,
        func.count(RiskFactor.id).label('count')
    ).group_by(
        RiskFactor.category
    ).order_by(
        func.count(RiskFactor.id).desc()
    ).limit(limit)

    result = await db.execute(query)
    rows = result.all()

    total_factors = sum(r.count for r in rows)

    factors = []
    for row in rows:
        percentage = (row.count / total_factors * 100) if total_factors > 0 else 0

        # Calculate trend (compare current week vs previous week)
        trend = await calculate_trend(db, row.category)

        factors.append({
            'name': row.category,
            'percentage': round(percentage, 1),
            'trend': trend
        })

    return factors


async def calculate_trend(db: AsyncSession, category: str) -> str:
    """
    Compare current week vs previous week count for a risk factor category.
    """
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    # Count this week
    query_current = select(func.count(RiskFactor.id)).where(
        and_(
            RiskFactor.category == category,
            RiskFactor.id.in_(
                select(RiskFactor.id).join(Prediction).where(Prediction.created_at >= week_ago)
            )
        )
    )
    current_result = await db.execute(query_current)
    current_count = current_result.scalar() or 0

    # Count previous week
    query_prev = select(func.count(RiskFactor.id)).where(
        and_(
            RiskFactor.category == category,
            RiskFactor.id.in_(
                select(RiskFactor.id).join(Prediction).where(
                    and_(
                        Prediction.created_at >= two_weeks_ago,
                        Prediction.created_at < week_ago
                    )
                )
            )
        )
    )
    prev_result = await db.execute(query_prev)
    prev_count = prev_result.scalar() or 0

    if current_count > prev_count:
        return 'up'
    elif current_count < prev_count:
        return 'down'
    else:
        return 'stable'


async def get_risk_distribution(db: AsyncSession) -> Dict:
    """
    Get simple count by risk level.
    """
    query = select(
        Prediction.risk_level,
        func.count(Prediction.id).label('count')
    ).group_by(
        Prediction.risk_level
    )

    result = await db.execute(query)
    rows = result.all()

    distribution = {'high': 0, 'medium': 0, 'low': 0}
    for row in rows:
        distribution[row.risk_level] = row.count

    return distribution
