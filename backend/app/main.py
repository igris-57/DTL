# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.schemas import HealthResponse
from app.models.ml_model import ml_model
from app.database import init_db
from app.routers import prediction, admin

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="ML-powered student dropout risk prediction with personalized support recommendations"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(prediction.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)

@app.on_event("startup")
async def startup_event():
    """Load ML model and initialize database on startup"""
    print(f"Starting {settings.app_name} v{settings.version}")

    # Initialize database
    try:
        await init_db()
        print("[OK] Database initialized successfully")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")

    # Archive known legacy model files (do not delete them)
    # Note: Do NOT include the currently active model paths here
    legacy_paths = [
        "ml/Model_Random_Forest.pkl",
        "ml/scaler_rf.pkl",
        "models/Model_Gradient_Boosting.pkl",
        "models/scaler.pkl",
    ]
    try:
        ml_model.archive_legacy_files(legacy_paths)
    except Exception as e:
        print(f"Archiving legacy models failed: {e}")

    # Try to load the active model (will use fallback if not available)
    ml_model.load_model(settings.model_path, settings.scaler_path)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Student Dropout Risk Prediction API",
        "version": settings.version,
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=settings.version,
        ml_model_loaded=ml_model.is_loaded
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
