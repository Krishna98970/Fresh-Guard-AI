from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pymongo.database import Database

from core.database import get_db
from core.security import decode_subject

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/auth/login')


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Database[dict[str, object]] = Depends(get_db),
) -> dict[str, object]:
    try:
        employee_id = decode_subject(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token') from exc
    user = db.users.find_one({'employee_id': employee_id, 'is_active': True})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found or inactive')
    warehouse = db.warehouses.find_one({'warehouse_id': user['warehouse_id']})
    if warehouse is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User warehouse not found')
    user['warehouse'] = warehouse
    return user


