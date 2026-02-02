# backend/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Student Dropout Risk Prediction API"
    version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # Model settings
    # Active model: Gradient Boosting trained with scikit-learn 1.4.0
    # Performance: 87.8% Accuracy, 0.9211 AUC-ROC
    model_path: str = "ml/saved_models/model_gb.joblib"
    scaler_path: str = "ml/saved_models/scaler_gb.joblib"

    # Directory for storing old/backup models
    archived_models_dir: str = "archived_models"

    # Database settings
    database_url: str = "sqlite+aiosqlite:///./database.db"

    # CORS settings
    allowed_origins: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"

settings = Settings()
