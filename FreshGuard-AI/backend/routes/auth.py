from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from pymongo.database import Database

from core.database import get_db
from core.security import create_access_token, verify_password
from dependencies.auth import get_current_user

router = APIRouter(prefix='/api/auth', tags=['Authentication'])


class LoginRequest(BaseModel):
    warehouse_id: str
    employee_id: str
    password: str


@router.post('/login')
def login(payload: LoginRequest, db: Database[dict[str, object]] = Depends(get_db)):
    user = db.users.find_one({'employee_id': payload.employee_id, 'is_active': True})
    warehouse = db.warehouses.find_one({'warehouse_id': payload.warehouse_id})
    if (
        user is None
        or warehouse is None
        or user['warehouse_id'] != payload.warehouse_id
        or not verify_password(payload.password, str(user['password_hash']))
    ):
        raise HTTPException(status_code=401, detail={'code': 'INVALID_CREDENTIALS', 'message': 'Invalid warehouse credentials'})
    user['warehouse'] = warehouse
    return {'access_token': create_access_token(str(user['employee_id'])), 'token_type': 'bearer', 'user': serialize_user(user)}


@router.get('/me')
def me(user: dict[str, object] = Depends(get_current_user)):
    return serialize_user(user)


def serialize_user(user: dict[str, object]) -> dict[str, object]:
    warehouse = user['warehouse']
    if not isinstance(warehouse, dict):
        raise RuntimeError('User warehouse data is invalid')
    return {
        'employee_id': user['employee_id'],
        'name': user['name'],
        'warehouse_id': warehouse['warehouse_id'],
        'role': user['role'],
    }



