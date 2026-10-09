from fastapi import APIRouter, Depends

from dependencies.auth import get_current_user
from models.user import User

router = APIRouter(prefix='/api/warehouses', tags=['Warehouse'])


@router.get('/me')
def get_warehouse(user: User = Depends(get_current_user)):
    warehouse = user.warehouse
    return {'warehouse_id': warehouse.warehouse_id, 'name': warehouse.name, 'location': warehouse.location, 'is_active': warehouse.is_active}
