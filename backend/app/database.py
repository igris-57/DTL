# backend/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, Index
from datetime import datetime
import os

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./database.db")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    connect_args={"check_same_thread": False}  # SQLite specific
)

# Session factory
SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for ORM models
Base = declarative_base()


# ============================================================================
# ORM Models
# ============================================================================

class Prediction(Base):
    """Main predictions table storing ML model results"""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Prediction results
    risk_level = Column(String, nullable=False, index=True)  # 'low', 'medium', 'high'
    risk_score = Column(Integer, nullable=False)
    dropout_probability = Column(Float, nullable=False)
    predicted_class = Column(String, nullable=True)  # 'Dropout' or 'Non-Dropout'
    prediction_confidence = Column(Float, nullable=False)

    # Source tracking
    endpoint = Column(String, nullable=False)  # 'simplified' or 'raw'


class AssessmentInput(Base):
    """Stores all form inputs from SimplifiedAssessmentRequest"""
    __tablename__ = "assessment_inputs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, index=True)

    # Consent (3 fields)
    consent_given = Column(Boolean, nullable=False)
    consent_data_processing = Column(Boolean, nullable=False)
    consent_anonymous_analytics = Column(Boolean, nullable=False)

    # Academic (5 fields)
    academic_year = Column(String, nullable=False)
    attendance = Column(String, nullable=False)
    overwhelm_frequency = Column(String, nullable=False)
    study_hours = Column(String, nullable=False)
    performance_satisfaction = Column(Integer, nullable=False)

    # Support (3 fields)
    advisor_interaction = Column(String, nullable=False)
    support_network_strength = Column(Integer, nullable=False)
    extracurricular_hours = Column(Integer, nullable=False)

    # Personal (3 fields)
    employment_status = Column(String, nullable=False)
    financial_stress = Column(String, nullable=False)
    career_alignment = Column(Integer, nullable=False)

    # Services (arrays stored as JSON text)
    services_used = Column(Text, nullable=True)  # JSON array
    withdrawal_considered = Column(Boolean, nullable=False)
    withdrawal_reasons = Column(Text, nullable=True)  # JSON array


class RiskFactor(Base):
    """Stores individual risk factors identified for each prediction"""
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, index=True)

    category = Column(String, nullable=False, index=True)  # e.g., 'Academic', 'Financial'
    factor = Column(String, nullable=False)
    impact = Column(String, nullable=False)  # 'low', 'medium', 'high'
    description = Column(Text, nullable=False)


class Recommendation(Base):
    """Stores personalized recommendations for each prediction"""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False, index=True)

    rec_type = Column(String, nullable=False, index=True)  # 'counseling', 'financial', 'academic', etc.
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    urgency = Column(String, nullable=False)  # 'immediate', 'soon', 'when-needed'
    contact = Column(String, nullable=True)


# ============================================================================
# Database Initialization
# ============================================================================

async def init_db():
    """
    Initialize database by creating all tables.
    This is called on application startup.
    """
    async with engine.begin() as conn:
        # Create all tables defined in Base metadata
        await conn.run_sync(Base.metadata.create_all)
        print("[OK] Database tables created successfully")


async def get_db():
    """
    Dependency function for FastAPI to provide database sessions.

    Usage:
        @app.get("/endpoint")
        async def my_endpoint(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
