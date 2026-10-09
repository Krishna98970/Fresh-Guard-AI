from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import create_access_token, verify_password
from dependencies.auth import get_current_user
from models.user import User

router = APIRouter(prefix='/api/auth', tags=['Authentication'])


class LoginRequest(BaseModel):
    warehouse_id: str
    employee_id: str
    password: str


@router.post('/login')
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.employee_id == payload.employee_id, User.is_active.is_(True)))
    if user is None or user.warehouse.warehouse_id != payload.warehouse_id or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail={'code': 'INVALID_CREDENTIALS', 'message': 'Invalid warehouse credentials'})
    return {'access_token': create_access_token(user.employee_id), 'token_type': 'bearer', 'user': serialize_user(user)}


@router.get('/me')
def me(user: User = Depends(get_current_user)):
    return serialize_user(user)


def serialize_user(user: User) -> dict[str, object]:
    return {'employee_id': user.employee_id, 'name': user.name, 'warehouse_id': user.warehouse.warehouse_id, 'role': user.role}
