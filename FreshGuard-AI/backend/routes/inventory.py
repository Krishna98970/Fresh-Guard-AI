from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import get_db
from dependencies.auth import get_current_user
from models.inventory import InventoryItem
from models.user import User

router = APIRouter(prefix='/api/inventory', tags=['Inventory'])


class InventoryCreate(BaseModel):
    batch_id: str
    product: str
    quantity: float
    unit: str = 'kg'
    quality_score: Optional[float] = None
    status: str = 'PENDING'


def serialize(item: InventoryItem) -> dict[str, object]:
    return {'id': item.id, 'batch_id': item.batch_id, 'product': item.product, 'quantity': item.quantity, 'unit': item.unit, 'warehouse_id': item.warehouse.warehouse_id, 'quality_score': item.quality_score, 'status': item.status, 'received_at': item.received_at.isoformat()}


@router.get('')
def list_inventory(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = db.scalars(select(InventoryItem).where(InventoryItem.warehouse_id == user.warehouse_id).order_by(InventoryItem.received_at.desc())).all()
    return {'data': [serialize(item) for item in items]}


@router.post('')
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = InventoryItem(warehouse_id=user.warehouse_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize(item)


@router.get('/{item_id}')
def get_inventory(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.scalar(select(InventoryItem).where(InventoryItem.id == item_id, InventoryItem.warehouse_id == user.warehouse_id))
    if item is None:
        raise HTTPException(status_code=404, detail='Inventory item not found')
    return serialize(item)


@router.put('/{item_id}')
def update_inventory(item_id: int, payload: InventoryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.scalar(select(InventoryItem).where(InventoryItem.id == item_id, InventoryItem.warehouse_id == user.warehouse_id))
    if item is None:
        raise HTTPException(status_code=404, detail='Inventory item not found')
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return serialize(item)
