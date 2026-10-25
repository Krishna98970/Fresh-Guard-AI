from datetime import datetime, timezone
from pathlib import Path
import re
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pymongo.database import Database


from core.database import get_db
from dependencies.auth import get_current_user
from services.image_service import validate_and_save
from services.inspection_service import inspect_image

router = APIRouter(prefix='/api/inspections', tags=['Inspections'])
UPLOAD_DIR = Path(__file__).resolve().parents[1] / 'uploads'


@router.post('')
async def create_inspection(
    image: UploadFile = File(...),
    inspection_type: str = Form('single'),
    batch_id: Optional[str] = Form(None),
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    if inspection_type not in {'single', 'box'}:
        raise HTTPException(status_code=422, detail='inspection_type must be single or box')
    contents = await image.read()
    try:
        image_path = validate_and_save(contents, UPLOAD_DIR)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={'code': 'INVALID_IMAGE', 'message': str(exc)}) from exc
    result = inspect_image(image_path, inspection_type)
    raw_items = result.get('items', [])
    if not isinstance(raw_items, list):
        raise RuntimeError('Inspection model returned an invalid detection list')
    items: list[dict[str, object]] = []
    for item in raw_items:
        if not isinstance(item, dict):
            raise RuntimeError('Inspection model returned an invalid detection entry')
        items.append(item)
    record: dict[str, object] = {
        '_id': str(uuid4()),
        'inspection_id': f'FG-{uuid4().hex[:6].upper()}',
        'employee_id': user['employee_id'],
        'warehouse_id': user['warehouse_id'],
        'inspection_type': inspection_type,
        'batch_id': batch_id,
        'image_path': str(image_path),
        'product': str(result.get('product', '')),
        'condition': str(result.get('condition', '')),
        'confidence': float(result.get('confidence', 0)),
        'quality_score': float(result.get('quality_score', 0)),
        'grade': str(result.get('grade', '')),
        'decision': str(result.get('decision', '')),
        'defects': result.get('defects', []),
        'model_details': str(result.get('details', '')),
        'detections': [
            {
                'label': str(item['label']),
                'confidence': float(item['confidence']),
                'x': float(item['x']),
                'y': float(item['y']),
                'width': float(item['width']),
                'height': float(item['height']),
            }
            for item in items
        ],
        'created_at': datetime.now(timezone.utc),
    }
    db.inspections.insert_one(record)
    return serialize_inspection(record)


@router.get('')
def list_inspections(
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    query: dict[str, object] = {'warehouse_id': user['warehouse_id']}
    if search:
        expression = {'$regex': re.escape(search), '$options': 'i'}
        query['$or'] = [
            {'inspection_id': expression},
            {'product': expression},
            {'batch_id': expression},
        ]
    if status:
        query['decision'] = status
    total = db.inspections.count_documents(query)
    records = db.inspections.find(query).sort('created_at', -1).skip((page - 1) * limit).limit(limit)
    return {'data': [serialize_inspection(item) for item in records], 'page': page, 'limit': limit, 'total': total}


@router.get('/{inspection_id}')
def get_inspection(
    inspection_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    record = db.inspections.find_one(
        {'inspection_id': inspection_id, 'warehouse_id': user['warehouse_id']}
    )
    if record is not None:
        return serialize_inspection(record)
    raise HTTPException(status_code=404, detail='Inspection not found')


def serialize_inspection(record: dict[str, object]) -> dict[str, object]:
    created_at = record['created_at']
    detections = record['detections']
    if not isinstance(created_at, datetime) or not isinstance(detections, list):
        raise RuntimeError('Inspection record has invalid timestamp or detection data')
    return {
        'inspection_id': record['inspection_id'],
        'inspection_type': record['inspection_type'],
        'batch_id': record['batch_id'],
        'product': record['product'],
        'condition': record['condition'],
        'confidence': record['confidence'],
        'quality_score': record['quality_score'],
        'grade': record['grade'],
        'decision': record['decision'],
        'defects': record['defects'],
        'details': record['model_details'],
        'detections': detections,
        'employee_id': record['employee_id'],
        'warehouse_id': record['warehouse_id'],
        'timestamp': created_at.isoformat(),
    }
