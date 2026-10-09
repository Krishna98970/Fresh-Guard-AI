from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from core.database import get_db
from dependencies.auth import get_current_user
from models.inspection import Inspection
from models.user import User
from services.image_service import validate_and_save
from services.inspection_service import inspect_image

router = APIRouter(prefix='/api/inspections', tags=['Inspections'])
UPLOAD_DIR = Path(__file__).resolve().parents[1] / 'uploads'


@router.post('')
async def create_inspection(image: UploadFile = File(...), inspection_type: str = Form('single'), batch_id: Optional[str] = Form(None), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if inspection_type not in {'single', 'box'}:
        raise HTTPException(status_code=422, detail='inspection_type must be single or box')
    contents = await image.read()
    try:
        image_path = validate_and_save(contents, UPLOAD_DIR)
        result = inspect_image(image_path, inspection_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={'code': 'INVALID_IMAGE', 'message': str(exc)}) from exc
    record = Inspection(inspection_id=f'FG-{uuid4().hex[:6].upper()}', employee_id=user.id, warehouse_id=user.warehouse_id, inspection_type=inspection_type, batch_id=batch_id, image_path=str(image_path), product=str(result.get('product', '')), condition=str(result.get('condition', '')), confidence=float(result.get('confidence', 0)), quality_score=float(result.get('quality_score', 0)), grade=str(result.get('grade', '')), decision=str(result.get('decision', '')), defects=result.get('defects', []), model_details=str(result.get('details', '')))
    db.add(record)
    db.commit()
    db.refresh(record)
    return serialize_inspection(record)


@router.get('')
def list_inspections(search: Optional[str] = None, status: Optional[str] = None, page: int = 1, limit: int = 20, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = select(Inspection).where(Inspection.warehouse_id == user.warehouse_id)
    if search:
        query = query.where(or_(Inspection.inspection_id.ilike(f'%{search}%'), Inspection.product.ilike(f'%{search}%'), Inspection.batch_id.ilike(f'%{search}%')))
    if status:
        query = query.where(Inspection.decision == status)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    start = max(page - 1, 0) * limit
    records = db.scalars(query.order_by(Inspection.created_at.desc()).offset(start).limit(limit)).all()
    return {'data': [serialize_inspection(item) for item in records], 'page': page, 'limit': limit, 'total': total}


@router.get('/{inspection_id}')
def get_inspection(inspection_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    record = db.scalar(select(Inspection).where(Inspection.inspection_id == inspection_id, Inspection.warehouse_id == user.warehouse_id))
    if record is not None:
        return serialize_inspection(record)
    raise HTTPException(status_code=404, detail='Inspection not found')


def serialize_inspection(record: Inspection) -> dict[str, object]:
    return {'inspection_id': record.inspection_id, 'inspection_type': record.inspection_type, 'batch_id': record.batch_id, 'product': record.product, 'condition': record.condition, 'confidence': record.confidence, 'quality_score': record.quality_score, 'grade': record.grade, 'decision': record.decision, 'defects': record.defects, 'employee_id': record.employee.employee_id, 'warehouse_id': record.warehouse.warehouse_id, 'timestamp': record.created_at.isoformat()}
