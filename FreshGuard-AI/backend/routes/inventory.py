from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pymongo.database import Database

from core.database import get_db
from dependencies.auth import get_current_user
from routes.workflow import _require_role

router = APIRouter(prefix='/api/inventory', tags=['Inventory'])


class InventoryCreate(BaseModel):
    batch_id: str
    product: str
    quantity: float
    unit: str = 'kg'
    quality_score: Optional[float] = None
    status: str = 'PENDING'


def serialize(item: dict[str, object]) -> dict[str, object]:
    received_at = item['received_at']
    if not isinstance(received_at, datetime):
        raise RuntimeError('Inventory received_at value is invalid')
    return {
        'id': str(item['_id']),
        'batch_id': item['batch_id'],
        'product': item['product'],
        'quantity': item['quantity'],
        'unit': item['unit'],
        'warehouse_id': item['warehouse_id'],
        'quality_score': item.get('quality_score'),
        'status': item['status'],
        'received_at': received_at.isoformat(),
    }


@router.get('')
def list_inventory(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE')
    items = db.inventory.find({'warehouse_id': user['warehouse_id']}).sort('received_at', -1)
    return {'data': [serialize(item) for item in items]}


@router.post('')
def create_inventory(
    payload: InventoryCreate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE')
    item = {
        '_id': str(uuid4()),
        'warehouse_id': user['warehouse_id'],
        **payload.model_dump(),
        'received_at': datetime.now(timezone.utc),
    }
    db.inventory.insert_one(item)
    return serialize(item)


@router.get('/{item_id}')
def get_inventory(
    item_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE')
    item = db.inventory.find_one({'_id': item_id, 'warehouse_id': user['warehouse_id']})
    if item is None:
        raise HTTPException(status_code=404, detail='Inventory item not found')
    return serialize(item)


@router.put('/{item_id}')
def update_inventory(
    item_id: str,
    payload: InventoryCreate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE')
    item = db.inventory.find_one({'_id': item_id, 'warehouse_id': user['warehouse_id']})
    if item is None:
        raise HTTPException(status_code=404, detail='Inventory item not found')
    db.inventory.update_one(
        {'_id': item_id, 'warehouse_id': user['warehouse_id']},
        {'$set': payload.model_dump()},
    )
    item.update(payload.model_dump())
    return serialize(item)

