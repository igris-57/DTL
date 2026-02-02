// frontend/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PredictionResponse {
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  dropout_probability: number;
  risk_factors: Array<{
    category: string;
    factor: string;
    impact: string;
    description: string;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    urgency: string;
    contact?: string;
  }>;
  prediction_confidence: number;
}

export async function predictDropoutRisk(formData: any): Promise<PredictionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/predict/simplified`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Consent
        consent_given: formData.consentGiven,
        consent_data_processing: formData.consentDataProcessing,
        consent_anonymous_analytics: formData.consentAnonymousAnalytics,
        
        // Academic
        academic_year: formData.academicYear,
        attendance: formData.attendance,
        overwhelm_frequency: formData.overwhelmFrequency,
        study_hours: formData.studyHours,
        performance_satisfaction: formData.performanceSatisfaction,
        
        // Support
        advisor_interaction: formData.advisorInteraction,
        support_network_strength: formData.supportNetworkStrength,
        extracurricular_hours: formData.extracurricularHours,
        
        // Personal
        employment_status: formData.employmentStatus,
        financial_stress: formData.financialStress,
        career_alignment: formData.careerAlignment,
        
        // Services
        services_used: formData.servicesUsed,
        withdrawal_considered: formData.withdrawalConsidered,
        withdrawal_reasons: formData.withdrawalReasons,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Return fallback prediction
    return fallbackPrediction(formData);
  }
}

function fallbackPrediction(formData: any): PredictionResponse {
  // Client-side fallback if API is unavailable
  let riskScore = 0;

  // Attendance
  const attendanceScores: Record<string, number> = {
    'always': 0, 'often': 5, 'sometimes': 15, 'rarely': 25, 'never': 35
  };
  riskScore += attendanceScores[formData.attendance] || 0;

  // Overwhelm
  const overwhelmScores: Record<string, number> = {
    'never': 0, 'rarely': 5, 'sometimes': 10, 'often': 20, 'always': 30
  };
  riskScore += overwhelmScores[formData.overwhelmFrequency] || 0;

  // Financial stress
  const financialScores: Record<string, number> = {
    'none': 0, 'low': 5, 'moderate': 10, 'high': 20, 'very-high': 25
  };
  riskScore += financialScores[formData.financialStress] || 0;

  // Withdrawal consideration
  if (formData.withdrawalConsidered) riskScore += 15;

  // Performance satisfaction (inverse)
  riskScore += Math.max(0, 10 - formData.performanceSatisfaction) * 2;

  riskScore = Math.min(100, Math.max(0, riskScore));

  const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 35 ? 'medium' : 'low';

  return {
    risk_level: riskLevel,
    risk_score: riskScore,
    dropout_probability: riskScore / 100,
    risk_factors: [],
    recommendations: [
      {
        type: 'peer',
        title: 'Stay Connected',
        description: 'Continue engaging with campus resources',
        urgency: 'when-needed'
      }
    ],
    prediction_confidence: 0.7
  };
}

export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

// ============================================================================
// Admin Dashboard APIs
// ============================================================================

export interface DashboardStats {
  totalAssessments: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  highRiskPercentage: number;
  mediumRiskPercentage: number;
  lowRiskPercentage: number;
  averageRiskScore: number;
}

export interface TrendDataPoint {
  week: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

export interface RiskFactorSummary {
  name: string;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AssessmentSummary {
  id: number;
  name: string;
  date: string;
  time: string;
  risk: 'low' | 'medium' | 'high';
  type: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/dashboard/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  const data = await response.json();

  // Transform snake_case to camelCase
  return {
    totalAssessments: data.total_assessments,
    highRiskCount: data.high_risk_count,
    mediumRiskCount: data.medium_risk_count,
    lowRiskCount: data.low_risk_count,
    highRiskPercentage: data.high_risk_percentage,
    mediumRiskPercentage: data.medium_risk_percentage,
    lowRiskPercentage: data.low_risk_percentage,
    averageRiskScore: data.average_risk_score,
  };
}

export async function getRiskTrends(period: string = 'weekly'): Promise<TrendDataPoint[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/dashboard/trends?period=${period}`);
  if (!response.ok) throw new Error('Failed to fetch trends');
  const data = await response.json();

  return data.data.map((d: any) => ({
    week: d.week,
    highRisk: d.high_risk,
    mediumRisk: d.medium_risk,
    lowRisk: d.low_risk,
  }));
}

export async function getTopRiskFactors(limit: number = 5): Promise<RiskFactorSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/risk-factors?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch risk factors');
  const data = await response.json();
  return data.factors;
}

export async function getRecentAssessments(limit: number = 10): Promise<AssessmentSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/recent-assessments?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch assessments');
  const data = await response.json();
  return data.assessments;
}

export async function getRiskDistribution(): Promise<{ high: number; medium: number; low: number }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/risk-distribution`);
  if (!response.ok) throw new Error('Failed to fetch distribution');
  return response.json();
}
