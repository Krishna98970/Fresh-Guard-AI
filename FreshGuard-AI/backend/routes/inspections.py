from datetime import datetime, timezone
from pathlib import Path
import re
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from pymongo.database import Database


from core.database import get_db
from dependencies.auth import get_current_user
from services.image_service import validate_and_save
from services.inspection_service import inspect_image
from routes.workflow import _alert, _require_role, recommend_packaging

router = APIRouter(prefix='/api/inspections', tags=['Inspections'])
UPLOAD_DIR = Path(__file__).resolve().parents[1] / 'uploads'


class DecisionOverride(BaseModel):
    decision: str
    reason: str = Field(min_length=1, max_length=1000)


@router.post('')
async def create_inspection(
    image: UploadFile = File(...),
    inspection_type: str = Form('single'),
    batch_id: Optional[str] = Form(None),
    order_id: Optional[str] = Form(None),
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER')
    if inspection_type not in {'single', 'box'}:
        raise HTTPException(status_code=422, detail='inspection_type must be single or box')
    order = None
    if order_id:
        order = db.orders.find_one({'order_id': order_id, 'warehouse_id': user['warehouse_id']})
        if order is None:
            raise HTTPException(status_code=404, detail='Order not found in this warehouse')
        if order.get('inspection_status') != 'PENDING':
            raise HTTPException(status_code=409, detail='Order is not awaiting inspection')
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
        'order_id': order_id,
        'image_path': str(image_path),
        'product': str(result.get('product', '')),
        'condition': str(result.get('condition', '')),
        'confidence': float(result.get('confidence', 0)),
        'quality_score': float(result.get('quality_score', 0)),
        'grade': str(result.get('grade', '')),
        'decision': str(result.get('decision', '')),
        'decision_reason': str(result.get('details', '')),
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
    if order is not None:
        now = record['created_at']
        updated_order = db.orders.update_one(
            {'order_id': order_id, 'warehouse_id': user['warehouse_id'], 'inspection_status': 'PENDING'},
            {
                '$set': {
                    'inspection_status': 'COMPLETED',
                    'inspection_id': record['inspection_id'],
                    'inspection_decision': record['decision'],
                    'inspection_confidence': record['confidence'],
                    'updated_at': now,
                    **({'packing_status': 'PENDING'} if record['decision'] == 'ACCEPT' else {}),
                },
                '$push': {
                    'status_history': {
                        'status': f'INSPECTION_{record["decision"]}',
                        'changed_at': now,
                        'changed_by': user['employee_id'],
                    },
                },
            },
        )
        if not updated_order.matched_count:
            db.inspections.delete_one({'inspection_id': record['inspection_id'], 'warehouse_id': user['warehouse_id']})
            image_path.unlink(missing_ok=True)
            raise HTTPException(status_code=409, detail='Order inspection was already completed')
        if record['decision'] == 'ACCEPT':
            db.packing_records.insert_one({
                '_id': str(uuid4()),
                'packing_id': f'PACK-{uuid4().hex[:10].upper()}',
                'order_id': order_id,
                'warehouse_id': user['warehouse_id'],
                'status': 'PENDING',
                'recommendation': recommend_packaging(order),
                'created_at': now,
                'updated_at': now,
            })
        else:
            severity = 'CRITICAL' if record['decision'] == 'REJECT' else 'WARNING'
            _alert(db, user['warehouse_id'], 'QUALITY', severity,
                   f'Order {order["order_number"]} inspection decision is {record["decision"]}.',
                   order_id)
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
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER')
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
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER')
    record = db.inspections.find_one(
        {'inspection_id': inspection_id, 'warehouse_id': user['warehouse_id']}
    )
    if record is not None:
        return serialize_inspection(record)
    raise HTTPException(status_code=404, detail='Inspection not found')


@router.patch('/{inspection_id}/decision')
def override_inspection_decision(
    inspection_id: str,
    payload: DecisionOverride,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    if user.get('role') not in {'ADMIN', 'QUALITY_MANAGER'}:
        raise HTTPException(status_code=403, detail='Only quality managers may override inspection decisions')
    decision = payload.decision
    reason = payload.reason.strip()
    if decision not in {'ACCEPT', 'REJECT'} or not reason:
        raise HTTPException(status_code=422, detail='decision must be ACCEPT or REJECT and reason is required')
    record = db.inspections.find_one(
        {'inspection_id': inspection_id, 'warehouse_id': user['warehouse_id']}
    )
    if record is None:
        raise HTTPException(status_code=404, detail='Inspection not found')
    if record.get('decision') != 'REVIEW':
        raise HTTPException(status_code=409, detail='Only inspections requiring review may be overridden')
    now = datetime.now(timezone.utc)
    override = {'decision': decision, 'reason': reason, 'approved_by': user['employee_id'], 'at': now}
    result = db.inspections.update_one(
        {'inspection_id': inspection_id, 'warehouse_id': user['warehouse_id'], 'decision': 'REVIEW'},
        {'$set': {'decision': decision, 'decision_reason': reason, 'decision_override': override}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=409, detail='Inspection decision changed before override could be applied')
    order_id = record.get('order_id')
    if isinstance(order_id, str):
        order = db.orders.find_one({'order_id': order_id, 'warehouse_id': user['warehouse_id']})
        if order is not None:
            db.orders.update_one(
                {'order_id': order_id, 'warehouse_id': user['warehouse_id']},
                {'$set': {'inspection_decision': decision, 'review_approved': decision == 'ACCEPT', 'updated_at': now},
                 '$push': {'status_history': {'status': f'REVIEW_OVERRIDE_{decision}', 'changed_at': now, 'changed_by': user['employee_id'], 'reason': reason}}},
            )
            if decision == 'ACCEPT':
                db.packing_records.update_one(
                    {'order_id': order_id, 'warehouse_id': user['warehouse_id']},
                    {'$setOnInsert': {
                        '_id': str(uuid4()),
                        'packing_id': f'PACK-{uuid4().hex[:10].upper()}',
                        'order_id': order_id,
                        'warehouse_id': user['warehouse_id'],
                        'status': 'PENDING',
                        'recommendation': recommend_packaging(order),
                        'created_at': now,
                    }, '$set': {'updated_at': now}},
                    upsert=True,
                )
    return {'inspection_id': inspection_id, 'decision': decision, 'override': override}


def serialize_inspection(record: dict[str, object]) -> dict[str, object]:
    created_at = record['created_at']
    detections = record['detections']
    if not isinstance(created_at, datetime) or not isinstance(detections, list):
        raise RuntimeError('Inspection record has invalid timestamp or detection data')
    return {
        'inspection_id': record['inspection_id'],
        'inspection_type': record['inspection_type'],
        'batch_id': record['batch_id'],
        'order_id': record.get('order_id'),
        'product': record['product'],
        'condition': record['condition'],
        'confidence': record['confidence'],
        'quality_score': record['quality_score'],
        'grade': record['grade'],
        'decision': record['decision'],
        'decision_reason': record.get('decision_reason', record['model_details']),
        'defects': record['defects'],
        'details': record['model_details'],
        'detections': detections,
        'employee_id': record['employee_id'],
        'warehouse_id': record['warehouse_id'],
        'timestamp': created_at.isoformat(),
    }
