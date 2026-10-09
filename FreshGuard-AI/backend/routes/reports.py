import csv
from io import StringIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.database import get_db
from dependencies.auth import get_current_user
from models.inspection import Inspection
from models.user import User

router = APIRouter(prefix='/api/reports', tags=['Reports'])


@router.get('/summary')
def summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(Inspection).where(Inspection.warehouse_id == user.warehouse_id)).all()
    total = len(rows)
    return {'total_inspections': total, 'fresh': sum(row.decision == 'ACCEPT' for row in rows), 'review': sum(row.decision == 'REVIEW' for row in rows), 'rejected': sum(row.decision == 'REJECT' for row in rows), 'average_score': round(sum(row.quality_score or 0 for row in rows) / total, 1) if total else 0}


@router.get('/export')
def export_csv(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(Inspection).where(Inspection.warehouse_id == user.warehouse_id).order_by(Inspection.created_at.desc())).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['inspection_id', 'product', 'quality_score', 'decision', 'employee_id', 'created_at'])
    for row in rows:
        writer.writerow([row.inspection_id, row.product, row.quality_score, row.decision, row.employee.employee_id, row.created_at.isoformat()])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv', headers={'Content-Disposition': 'attachment; filename=freshguard-inspections.csv'})