# backend/app/routers/admin.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.repositories.prediction_repository import (
    get_dashboard_stats,
    get_risk_trends,
    get_recent_assessments,
    get_top_risk_factors,
    get_risk_distribution
)
from app.models.schemas import (
    DashboardStatsResponse,
    TrendsResponse,
    TrendDataPoint,
    RiskFactorsResponse,
    RecentAssessmentsResponse,
    RiskDistributionResponse
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    Get overall dashboard statistics including:
    - Total number of assessments
    - Risk level distribution (high/medium/low counts and percentages)
    - Average risk score

    Returns:
        DashboardStatsResponse with aggregated statistics
    """
    try:
        stats = await get_dashboard_stats(db)
        return DashboardStatsResponse(**stats)
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        # Return empty stats on error
        return DashboardStatsResponse(
            total_assessments=0,
            high_risk_count=0,
            medium_risk_count=0,
            low_risk_count=0,
            high_risk_percentage=0.0,
            medium_risk_percentage=0.0,
            low_risk_percentage=0.0,
            average_risk_score=0.0
        )


@router.get("/dashboard/trends", response_model=TrendsResponse)
async def dashboard_trends(period: str = 'weekly', db: AsyncSession = Depends(get_db)):
    """
    Get historical risk trend data for the dashboard chart.

    Args:
        period: Time period for aggregation (default: 'weekly')

    Returns:
        TrendsResponse with weekly data points showing risk distribution over time
    """
    try:
        trends_data = await get_risk_trends(db, weeks=8)
        trend_points = [TrendDataPoint(**item) for item in trends_data]
        return TrendsResponse(data=trend_points)
    except Exception as e:
        print(f"Error fetching trends: {e}")
        # Return empty trends on error
        return TrendsResponse(data=[])


@router.get("/risk-factors", response_model=RiskFactorsResponse)
async def top_risk_factors(limit: int = 5, db: AsyncSession = Depends(get_db)):
    """
    Get the top N risk factors by occurrence.

    Args:
        limit: Maximum number of risk factors to return (default: 5)

    Returns:
        RiskFactorsResponse with top risk factors and their trends
    """
    try:
        factors = await get_top_risk_factors(db, limit=limit)
        return RiskFactorsResponse(factors=factors)
    except Exception as e:
        print(f"Error fetching risk factors: {e}")
        # Return empty factors on error
        return RiskFactorsResponse(factors=[])


@router.get("/recent-assessments", response_model=RecentAssessmentsResponse)
async def recent_assessments(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Get the most recent student assessments.

    Args:
        limit: Maximum number of assessments to return (default: 10)

    Returns:
        RecentAssessmentsResponse with recent assessment summaries
    """
    try:
        assessments = await get_recent_assessments(db, limit=limit)
        return RecentAssessmentsResponse(assessments=assessments)
    except Exception as e:
        print(f"Error fetching recent assessments: {e}")
        # Return empty assessments on error
        return RecentAssessmentsResponse(assessments=[])


@router.get("/risk-distribution", response_model=RiskDistributionResponse)
async def risk_distribution(db: AsyncSession = Depends(get_db)):
    """
    Get simple count of predictions by risk level.

    Returns:
        RiskDistributionResponse with counts for high, medium, and low risk
    """
    try:
        distribution = await get_risk_distribution(db)
        return RiskDistributionResponse(**distribution)
    except Exception as e:
        print(f"Error fetching risk distribution: {e}")
        # Return zero distribution on error
        return RiskDistributionResponse(high=0, medium=0, low=0)
