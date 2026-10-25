from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from core.database import get_db
from dependencies.auth import get_current_user

router = APIRouter(prefix='/api/notifications', tags=['Notifications'])


@router.get('')
def list_notifications(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    rows = db.notifications.find({'user_id': user['employee_id']}).sort('created_at', -1)
    data = []
    for row in rows:
        created_at = row['created_at']
        if not isinstance(created_at, datetime):
            raise RuntimeError('Notification record has an invalid timestamp')
        data.append({
            'id': str(row['_id']),
            'title': row['title'],
            'message': row['message'],
            'type': row['notification_type'],
            'is_read': row['is_read'],
            'created_at': created_at.isoformat(),
        })
    return {'data': data}


@router.patch('/{notification_id}/read')
def mark_read(
    notification_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    ids: list[object] = [notification_id]
    if ObjectId.is_valid(notification_id):
        ids.append(ObjectId(notification_id))
    result = db.notifications.update_one(
        {'_id': {'$in': ids}, 'user_id': user['employee_id']},
        {'$set': {'is_read': True, 'read_at': datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Notification not found')
    return {'success': True}
