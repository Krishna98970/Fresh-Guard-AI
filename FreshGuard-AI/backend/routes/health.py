from fastapi import APIRouter

from core.config import settings
from services.model_manager import model_manager

router = APIRouter(prefix='/api/health', tags=['Health'])


@router.get('')
def health() -> dict[str, object]:
    return {'status': 'healthy', 'database': 'configured', 'mock_ai': settings.mock_ai, **model_manager.status}
