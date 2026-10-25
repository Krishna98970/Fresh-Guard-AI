from fastapi import APIRouter, Depends
from pymongo.database import Database

from core.database import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix='/api/analytics', tags=['Analytics'])


@router.get('/dashboard')
<<<<<<< HEAD
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    base = select(Inspection).where(Inspection.warehouse_id == user.warehouse_id).subquery()
    total = db.scalar(select(func.count()).select_from(base)) or 0
    fresh = db.scalar(select(func.count()).select_from(base).where(base.c.decision == 'ACCEPT')) or 0
    review = db.scalar(select(func.count()).select_from(base).where(base.c.decision == 'REVIEW')) or 0
    rejected = db.scalar(select(func.count()).select_from(base).where(base.c.decision == 'REJECT')) or 0
    average = db.scalar(select(func.avg(base.c.quality_score))) or 0
    return {'total_inspections': total, 'fresh_count': fresh, 'review_count': review, 'rejected_count': rejected, 'fresh_rate': round(fresh / total * 100, 1) if total else 0, 'reject_rate': round(rejected / total * 100, 1) if total else 0, 'average_quality_score': round(float(average), 1)}

=======
def dashboard(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    result = next(
        db.inspections.aggregate([
            {'$match': {'warehouse_id': user['warehouse_id']}},
            {
                '$group': {
                    '_id': None,
                    'total': {'$sum': 1},
                    'fresh': {'$sum': {'$cond': [{'$eq': ['$decision', 'ACCEPT']}, 1, 0]}},
                    'review': {'$sum': {'$cond': [{'$eq': ['$decision', 'REVIEW']}, 1, 0]}},
                    'rejected': {'$sum': {'$cond': [{'$eq': ['$decision', 'REJECT']}, 1, 0]}},
                    'average': {'$avg': '$quality_score'},
                },
            },
        ]),
        None,
    ) or {'total': 0, 'fresh': 0, 'review': 0, 'rejected': 0, 'average': 0}
    total = int(result['total'])
    fresh = int(result['fresh'])
    rejected = int(result['rejected'])
    average = float(result.get('average') or 0)
    return {
        'total_inspections': total,
        'fresh_count': fresh,
        'review_count': int(result['review']),
        'rejected_count': rejected,
        'fresh_rate': round(fresh / total * 100, 1) if total else 0,
        'reject_rate': round(rejected / total * 100, 1) if total else 0,
        'average_quality_score': round(average, 1),
    }
>>>>>>> f1596003 (Update FreshGuard AI)
