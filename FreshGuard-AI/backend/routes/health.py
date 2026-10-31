from fastapi import APIRouter, Depends
from pymongo.database import Database

from core.database import get_db
from services.model_manager import model_manager

router = APIRouter(prefix='/api/health', tags=['Health'])


@router.get('')
def health(db: Database[dict[str, object]] = Depends(get_db)) -> dict[str, object]:
    db.command('ping')
    return {'status': 'healthy', 'database': 'connected', **model_manager.status}


