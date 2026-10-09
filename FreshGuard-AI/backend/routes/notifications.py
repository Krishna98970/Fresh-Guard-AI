from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.database import get_db
from dependencies.auth import get_current_user
from models.notification import Notification
from models.user import User

router = APIRouter(prefix='/api/notifications', tags=['Notifications'])


@router.get('')
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())).all()
    return {'data': [{'id': row.id, 'title': row.title, 'message': row.message, 'type': row.notification_type, 'is_read': row.is_read, 'created_at': row.created_at.isoformat()} for row in rows]}


@router.patch('/{notification_id}/read')
def mark_read(notification_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id))
    if row is None:
        raise HTTPException(status_code=404, detail='Notification not found')
    row.is_read = True
    row.read_at = datetime.now(timezone.utc)
    db.commit()
    return {'success': True}
