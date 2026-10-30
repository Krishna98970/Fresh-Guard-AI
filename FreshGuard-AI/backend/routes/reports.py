import csv
from datetime import datetime
from io import StringIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pymongo.database import Database

from core.database import get_db
from dependencies.auth import get_current_user
from routes.workflow import _require_role

router = APIRouter(prefix='/api/reports', tags=['Reports'])


@router.get('/summary')
def summary(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER')
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
                    'average_score': {'$avg': '$quality_score'},
                },
            },
        ]),
        None,
    ) or {'total': 0, 'fresh': 0, 'review': 0, 'rejected': 0, 'average_score': 0}
    return {
        'total_inspections': int(result['total']),
        'fresh': int(result['fresh']),
        'review': int(result['review']),
        'rejected': int(result['rejected']),
        'average_score': round(float(result.get('average_score') or 0), 1),
    }


@router.get('/export')
def export_csv(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER')
    rows = db.inspections.find({'warehouse_id': user['warehouse_id']}).sort('created_at', -1)
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['inspection_id', 'product', 'quality_score', 'decision', 'employee_id', 'created_at'])
    for row in rows:
        created_at = row['created_at']
        if not isinstance(created_at, datetime):
            raise RuntimeError('Inspection record has an invalid timestamp')
        writer.writerow([
            row['inspection_id'],
            row.get('product'),
            row.get('quality_score'),
            row.get('decision'),
            row.get('employee_id'),
            created_at.isoformat(),
        ])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv', headers={'Content-Disposition': 'attachment; filename=freshguard-inspections.csv'})