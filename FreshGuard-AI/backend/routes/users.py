from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from pymongo.database import Database

from core.database import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix='/api/users', tags=['Users'])


class ProfileUpdate(BaseModel):
    name: str
    email: Optional[str] = None


@router.get('/me')
def get_profile(user: dict[str, object] = Depends(get_current_user)):
    warehouse = user['warehouse']
    if not isinstance(warehouse, dict):
        raise RuntimeError('User warehouse data is invalid')
    return {
        'employee_id': user['employee_id'],
        'name': user['name'],
        'email': user.get('email'),
        'warehouse_id': warehouse['warehouse_id'],
        'role': user['role'],
    }


@router.patch('/me')
def update_profile(
    payload: ProfileUpdate,
    user: dict[str, object] = Depends(get_current_user),
    db: Database[dict[str, object]] = Depends(get_db),
):
    db.users.update_one(
        {'employee_id': user['employee_id']},
        {'$set': {'name': payload.name, 'email': payload.email, 'updated_at': datetime.now(timezone.utc)}},
    )
    updated_user = db.users.find_one({'employee_id': user['employee_id']})
    if updated_user is None:
        raise RuntimeError('Updated user record could not be loaded')
    updated_user['warehouse'] = user['warehouse']
    return get_profile(updated_user)
