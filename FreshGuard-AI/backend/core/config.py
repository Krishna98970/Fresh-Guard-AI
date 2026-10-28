import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / '.env')


def _mongo_database_name() -> str:
    configured_name = os.getenv('MONGODB_DATABASE')
    if configured_name:
        return configured_name
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/freshguard')
    return urlparse(mongo_uri).path.lstrip('/') or 'freshguard'


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/freshguard')
    mongodb_database: str = _mongo_database_name()
    jwt_secret: str = os.getenv('JWT_SECRET', 'change-this-development-secret')
    max_upload_size_mb: int = int(os.getenv('MAX_UPLOAD_SIZE_MB', '10'))
    frontend_url: str = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    produce_model_path: str = os.getenv('PRODUCE_MODEL_PATH', '../../krishna/cnn_model.pt')
    cardboard_model_path: str = os.getenv('CARDBOARD_MODEL_PATH', '../../krishna/yolov8n.pt')
    accept_threshold: float = float(os.getenv('ACCEPT_THRESHOLD', '0.85'))
    review_threshold: float = float(os.getenv('REVIEW_THRESHOLD', '0.60'))


settings = Settings()

