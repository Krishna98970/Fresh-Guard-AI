from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.database import get_db
from dependencies.auth import get_current_user
from models.inspection import Inspection
from models.user import User

router = APIRouter(prefix='/api/analytics', tags=['Analytics'])


@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    base = select(Inspection).where(Inspection.warehouse_id == user.warehouse_id).subquery()
    total = db.scalar(select(func.count()).select_from(base)) or 0
    fresh = db.scalar(select(func.count()).select_from(base).where(base.c.decision == 'ACCEPT')) or 0
    review = db.scalar(select(func.count()).select_from(base).where(base.c.decision == 'REVIEW')) or 0
    rejected = db.scalar(select(func.count()).select_from(base).where(base.c.decision == 'REJECT')) or 0
    average = db.scalar(select(func.avg(base.c.quality_score))) or 0
    return {'total_inspections': total, 'fresh_count': fresh, 'review_count': review, 'rejected_count': rejected, 'fresh_rate': round(fresh / total * 100, 1) if total else 0, 'reject_rate': round(rejected / total * 100, 1) if total else 0, 'average_quality_score': round(float(average), 1)}
