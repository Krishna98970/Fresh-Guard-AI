from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from core.database import get_db
from dependencies.auth import get_current_user
from models.user import User

router = APIRouter(prefix='/api/users', tags=['Users'])


class ProfileUpdate(BaseModel):
    name: str
    email: Optional[str] = None


@router.get('/me')
def get_profile(user: User = Depends(get_current_user)):
    return {'employee_id': user.employee_id, 'name': user.name, 'email': user.email, 'warehouse_id': user.warehouse.warehouse_id, 'role': user.role}


@router.patch('/me')
def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.name = payload.name
    user.email = payload.email
    db.commit()
    db.refresh(user)
    return get_profile(user)
