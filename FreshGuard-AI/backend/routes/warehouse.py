from fastapi import APIRouter, Depends

from dependencies.auth import get_current_user

router = APIRouter(prefix='/api/warehouses', tags=['Warehouse'])


@router.get('/me')
def get_warehouse(user: dict[str, object] = Depends(get_current_user)):
    warehouse = user['warehouse']
    if not isinstance(warehouse, dict):
        raise RuntimeError('User warehouse data is invalid')
    return {
        'warehouse_id': warehouse['warehouse_id'],
        'name': warehouse['name'],
        'location': warehouse['location'],
        'is_active': warehouse['is_active'],
    }
