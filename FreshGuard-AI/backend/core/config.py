import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv('DATABASE_URL', 'postgresql+psycopg://freshguard:freshguard@localhost:5432/freshguard')
    jwt_secret: str = os.getenv('JWT_SECRET', 'change-this-development-secret')
    mock_ai: bool = os.getenv('MOCK_AI', 'true').lower() == 'true'
    max_upload_size_mb: int = int(os.getenv('MAX_UPLOAD_SIZE_MB', '10'))
    frontend_url: str = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    model1_path: str = os.getenv('MODEL1_PATH', 'models/model1/model1.keras')
    model2_path: str = os.getenv('MODEL2_PATH', 'models/model2/model2.keras')
    accept_threshold: float = float(os.getenv('ACCEPT_THRESHOLD', '0.85'))
    review_threshold: float = float(os.getenv('REVIEW_THRESHOLD', '0.60'))


settings = Settings()
