from datetime import datetime, timezone
import hmac
from typing import Literal, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError, PyMongoError
from pymongo.database import Database

from core.config import settings
from core.database import get_db
from dependencies.auth import get_current_user

router = APIRouter(tags=['Order lifecycle'])

DISPATCH_STATUSES = {
    'READY_FOR_DISPATCH',
    'ASSIGNED',
    'DISPATCHED',
    'IN_TRANSIT',
    'DELIVERED',
    'DELAYED',
    'FAILED',
    'CANCELLED',
}
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _require_role(user: dict[str, object], *roles: str) -> None:
    if user.get('role') not in roles:
        raise HTTPException(status_code=403, detail='You are not authorized to perform this action')


def _require_trusted_device(source: str, device_token: Optional[str]) -> None:
    if source == 'DEMO':
        return
    expected = settings.telemetry_device_token
    if not expected:
        raise HTTPException(status_code=503, detail='Device telemetry is not configured')
    if not device_token or not hmac.compare_digest(device_token, expected):
        raise HTTPException(status_code=401, detail='Invalid or missing device token')


def _record_status(
    record: dict[str, object], status_value: str, user: dict[str, object], field: str = 'status'
) -> dict[str, object]:
    at = _now()
    history = record.get('status_history')
    if not isinstance(history, list):
        history = []
    history.append({
        'status': status_value,
        'changed_at': at,
        'changed_by': user['employee_id'],
    })
    record[field] = status_value
    record['updated_at'] = at
    record['status_history'] = history
    return record


def _alert(
    db: Database[dict[str, object]],
    warehouse_id: object,
    category: str,
    severity: str,
    message: str,
    order_id: Optional[str] = None,
    dispatch_id: Optional[str] = None,
) -> None:
    db.alerts.insert_one({
        '_id': str(uuid4()),
        'alert_id': f'ALT-{uuid4().hex[:10].upper()}',
        'warehouse_id': warehouse_id,
        'order_id': order_id,
        'dispatch_id': dispatch_id,
        'category': category,
        'severity': severity,
        'message': message,
        'is_read': False,
        'is_resolved': False,
        'created_at': _now(),
    })


def _alert_role_filter(user: dict[str, object]) -> dict[str, object]:
    if user.get('role') == 'DISPATCH_MANAGER':
        return {'category': {'$in': ['DELIVERY', 'TEMPERATURE', 'TRANSIT']}}
    return {}


class OrderItemInput(BaseModel):
    product_id: Optional[str] = None
    product_name: str = Field(min_length=1, max_length=120)
    category: str = Field(default='FRUITS', min_length=1, max_length=40)
    quantity: float = Field(gt=0)
    unit: str = Field(default='kg', min_length=1, max_length=20)


class OrderCreate(BaseModel):
    order_number: Optional[str] = Field(default=None, min_length=1, max_length=80)
    customer_name: str = Field(min_length=1, max_length=120)
    customer_address: str = Field(min_length=1, max_length=500)
    customer_phone: Optional[str] = Field(default=None, max_length=40)
    destination: Optional[str] = Field(default=None, max_length=250)
    priority: Literal['LOW', 'NORMAL', 'HIGH', 'URGENT'] = 'NORMAL'
    items: list[OrderItemInput] = Field(min_length=1, max_length=100)


class PackingStatusUpdate(BaseModel):
    status: Literal['IN_PROGRESS', 'COMPLETED']
    packaging_type: Optional[str] = Field(default=None, max_length=80)
    quantity: Optional[float] = Field(default=None, gt=0)
    checklist: list[str] = Field(default_factory=list, max_length=30)
    verification_notes: Optional[str] = Field(default=None, max_length=1000)


class RiderCreate(BaseModel):
    rider_id: Optional[str] = Field(default=None, max_length=80)
    employee_id: Optional[str] = Field(default=None, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=1, max_length=40)


class RiderUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, min_length=1, max_length=40)
    availability: Optional[Literal['AVAILABLE', 'OFFLINE']] = None
    is_active: Optional[bool] = None


class DispatchCreate(BaseModel):
    order_id: str = Field(min_length=1, max_length=100)
    rider_id: str = Field(min_length=1, max_length=100)
    route: Optional[str] = Field(default=None, max_length=500)
    priority: Literal['LOW', 'NORMAL', 'HIGH', 'URGENT'] = 'NORMAL'
    expected_delivery_at: Optional[datetime] = None


class DispatchStatusUpdate(BaseModel):
    status: Literal['ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'FAILED', 'CANCELLED']


class LocationInput(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    source: Literal['GPS', 'DEMO'] = 'DEMO'


class TemperatureInput(BaseModel):
    temperature_c: float = Field(ge=-80, le=100)
    source: Literal['DEVICE', 'DEMO'] = 'DEMO'


class TransitEventInput(BaseModel):
    event_type: Literal['SHOCK', 'TILT', 'VIBRATION', 'SUDDEN_MOVEMENT', 'DELAY']
    description: str = Field(min_length=1, max_length=500)
    magnitude: Optional[float] = Field(default=None, ge=0)
    source: Literal['DEVICE', 'DEMO'] = 'DEMO'


class CustomerFeedbackInput(BaseModel):
    tracking_id: str = Field(min_length=1, max_length=100)
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=2000)


class TemperatureRange(BaseModel):
    minimum_c: float = Field(alias='min', ge=-80, le=100)
    maximum_c: float = Field(alias='max', ge=-80, le=100)


class TemperatureThresholdsUpdate(BaseModel):
    thresholds: dict[str, TemperatureRange] = Field(min_length=1, max_length=30)


def validate_dispatch_eligibility(order: dict[str, object]) -> None:
    if order.get('inspection_decision') != 'ACCEPT' and not order.get('review_approved'):
        raise HTTPException(status_code=409, detail='Dispatch requires an accepted or authorized-review inspection')
    if order.get('packing_status') != 'COMPLETED':
        raise HTTPException(status_code=409, detail='Dispatch requires completed packing')
    if order.get('dispatch_status') not in {'NOT_DISPATCHED', 'READY_FOR_DISPATCH'}:
        raise HTTPException(status_code=409, detail='Order is already dispatched or no longer eligible')


@router.post('/api/orders', status_code=201)
def create_order(
    payload: OrderCreate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE')
    order_id = str(uuid4())
    tracking_id = uuid4().hex
    now = _now()
    order: dict[str, object] = {
        '_id': order_id,
        'order_id': order_id,
        'order_number': payload.order_number or f'FG-{uuid4().hex[:10].upper()}',
        'tracking_id': tracking_id,
        'warehouse_id': user['warehouse_id'],
        'customer_name': payload.customer_name,
        'customer_address': payload.customer_address,
        'customer_phone': payload.customer_phone,
        'destination': payload.destination or payload.customer_address,
        'items': [item.model_dump() for item in payload.items],
        'priority': payload.priority,
        'inspection_status': 'PENDING',
        'inspection_decision': None,
        'packing_status': 'PENDING',
        'dispatch_status': 'NOT_DISPATCHED',
        'created_at': now,
        'updated_at': now,
        'status_history': [{'status': 'PENDING_INSPECTION', 'changed_at': now, 'changed_by': user['employee_id']}],
    }
    db.orders.insert_one(order)
    response = serialize_order(order)
    response['tracking_id'] = tracking_id
    return response


@router.get('/api/orders')
def list_orders(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    query: dict[str, object] = {'warehouse_id': user['warehouse_id']}
    if status:
        query['dispatch_status'] = status
    total = db.orders.count_documents(query)
    rows = db.orders.find(query).sort('created_at', -1).skip((page - 1) * limit).limit(limit)
    return {'data': [serialize_order(row) for row in rows], 'total': total, 'page': page, 'limit': limit}


@router.get('/api/packing')
def list_packing(
    status: Optional[str] = None,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'PACKING_OPERATOR', 'QUALITY_MANAGER')
    query: dict[str, object] = {'warehouse_id': user['warehouse_id']}
    if status:
        query['status'] = status
    return {'data': [serialize_document(row) for row in db.packing_records.find(query).sort('created_at', -1)]}


@router.patch('/api/packing/{order_id}/status')
def update_packing_status(
    order_id: str,
    payload: PackingStatusUpdate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'PACKING_OPERATOR')
    order = db.orders.find_one({'order_id': order_id, 'warehouse_id': user['warehouse_id']})
    if order is None:
        raise HTTPException(status_code=404, detail='Order not found')
    if order.get('inspection_decision') != 'ACCEPT' and not order.get('review_approved'):
        raise HTTPException(status_code=409, detail='Order must pass inspection or receive authorized approval before packing')
    if order.get('dispatch_status') not in {'NOT_DISPATCHED', 'READY_FOR_DISPATCH'}:
        raise HTTPException(status_code=409, detail='Packing cannot be changed after dispatch')
    if order.get('packing_status') == 'COMPLETED':
        raise HTTPException(status_code=409, detail='Packing is already completed')
    if payload.status == 'COMPLETED' and order.get('packing_status') != 'IN_PROGRESS':
        raise HTTPException(status_code=409, detail='Packing must be in progress before completion')
    if payload.status == 'IN_PROGRESS' and order.get('packing_status') not in {'PENDING', 'IN_PROGRESS'}:
        raise HTTPException(status_code=409, detail='Invalid packing status transition')
    if payload.status == 'COMPLETED' and not payload.checklist:
        raise HTTPException(status_code=422, detail='A non-empty packing checklist is required for completion')

    now = _now()
    record = db.packing_records.find_one({'order_id': order_id, 'warehouse_id': user['warehouse_id']})
    if record is None:
        record = {
            '_id': str(uuid4()),
            'packing_id': f'PACK-{uuid4().hex[:10].upper()}',
            'order_id': order_id,
            'warehouse_id': user['warehouse_id'],
            'recommendation': recommend_packaging(order),
            'created_at': now,
        }
    record.update({
        'status': payload.status,
        'packaging_type': payload.packaging_type or record.get('packaging_type') or record['recommendation']['packaging_type'],
        'quantity': payload.quantity or sum(float(item.get('quantity', 0)) for item in order['items']),
        'checklist': payload.checklist,
        'verification_notes': payload.verification_notes,
        'employee_id': user['employee_id'],
        'updated_at': now,
        'completed_at': now if payload.status == 'COMPLETED' else None,
    })
    db.packing_records.replace_one({'order_id': order_id, 'warehouse_id': user['warehouse_id']}, record, upsert=True)
    db.orders.update_one(
        {'order_id': order_id, 'warehouse_id': user['warehouse_id']},
        {'$set': {'packing_status': payload.status, 'updated_at': now},
         '$push': {'status_history': {'status': f'PACKING_{payload.status}', 'changed_at': now, 'changed_by': user['employee_id']}}},
    )
    return serialize_document(record)


@router.get('/api/riders')
def list_riders(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    return {'data': [serialize_document(row) for row in db.riders.find({'warehouse_id': user['warehouse_id'], 'is_active': True})]}


@router.get('/api/riders/{rider_id}/performance')
def rider_performance(
    rider_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    rider = db.riders.find_one({'rider_id': rider_id, 'warehouse_id': user['warehouse_id']})
    if rider is None:
        raise HTTPException(status_code=404, detail='Rider not found')
    dispatches = list(db.dispatches.find({'rider_id': rider_id, 'warehouse_id': user['warehouse_id']}))
    completed = [item for item in dispatches if item.get('status') == 'DELIVERED']
    failed = [item for item in dispatches if item.get('status') == 'FAILED']
    elapsed_minutes = [
        (item['delivered_at'] - item['dispatched_at']).total_seconds() / 60
        for item in completed
        if isinstance(item.get('delivered_at'), datetime) and isinstance(item.get('dispatched_at'), datetime)
        and item['delivered_at'] >= item['dispatched_at']
    ]
    events = list(db.transit_events.find({'warehouse_id': user['warehouse_id'], 'dispatch_id': {'$in': [item['dispatch_id'] for item in dispatches]}}))
    warning_count = sum(event.get('severity') == 'WARNING' for event in events)
    critical_count = sum(event.get('severity') == 'CRITICAL' for event in events)
    handling_score = max(0, 100 - warning_count * 10 - critical_count * 25) if events else None
    return {
        'rider_id': rider_id,
        'total_deliveries': len(dispatches),
        'completed_deliveries': len(completed),
        'failed_deliveries': len(failed),
        'average_delivery_minutes': round(sum(elapsed_minutes) / len(elapsed_minutes), 1) if elapsed_minutes else None,
        'handling_score': handling_score,
        'handling_score_rule': '100 minus 10 per warning event and 25 per critical event, floored at zero',
    }


@router.get('/api/settings/temperature-thresholds')
def get_temperature_thresholds(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER')
    warehouse = db.warehouses.find_one({'warehouse_id': user['warehouse_id']}, {'temperature_thresholds': 1})
    return {
        'thresholds': (warehouse or {}).get('temperature_thresholds', {
            'DEFAULT': {'min': settings.temperature_min_c, 'max': settings.temperature_max_c},
        }),
    }


@router.patch('/api/settings/temperature-thresholds')
def update_temperature_thresholds(
    payload: TemperatureThresholdsUpdate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN')
    if any(item.minimum_c >= item.maximum_c for item in payload.thresholds.values()):
        raise HTTPException(status_code=422, detail='Each maximum temperature must be greater than its minimum')
    thresholds = {
        category.strip().upper(): {'min': item.minimum_c, 'max': item.maximum_c}
        for category, item in payload.thresholds.items()
        if category.strip()
    }
    if not thresholds:
        raise HTTPException(status_code=422, detail='At least one named category threshold is required')
    db.warehouses.update_one(
        {'warehouse_id': user['warehouse_id']},
        {'$set': {'temperature_thresholds': thresholds, 'updated_at': _now()}},
    )
    return {'thresholds': thresholds}


@router.post('/api/riders', status_code=201)
def create_rider(
    payload: RiderCreate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'DISPATCH_MANAGER')
    now = _now()
    rider = {
        '_id': str(uuid4()),
        'rider_id': payload.rider_id or f'RDR-{uuid4().hex[:8].upper()}',
        'warehouse_id': user['warehouse_id'],
        'name': payload.name,
        'employee_id': payload.employee_id,
        'phone': payload.phone,
        'availability': 'AVAILABLE',
        'is_active': True,
        'created_at': now,
        'updated_at': now,
    }
    db.riders.insert_one(rider)
    return serialize_document(rider)


@router.patch('/api/riders/{rider_id}')
def update_rider(
    rider_id: str,
    payload: RiderUpdate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'DISPATCH_MANAGER')
    rider = db.riders.find_one({'rider_id': rider_id, 'warehouse_id': user['warehouse_id']})
    if rider is None:
        raise HTTPException(status_code=404, detail='Rider not found')
    updates = payload.model_dump(exclude_unset=True)
    if updates.get('availability') == 'OFFLINE' and rider.get('availability') == 'ON_DELIVERY':
        raise HTTPException(status_code=409, detail='A rider with an active delivery cannot be marked offline')
    updates['updated_at'] = _now()
    db.riders.update_one({'rider_id': rider_id, 'warehouse_id': user['warehouse_id']}, {'$set': updates})
    rider.update(updates)
    return serialize_document(rider)


@router.post('/api/dispatch', status_code=201)
def create_dispatch(
    payload: DispatchCreate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'DISPATCH_MANAGER')
    order = db.orders.find_one({'order_id': payload.order_id, 'warehouse_id': user['warehouse_id']})
    if order is None:
        raise HTTPException(status_code=404, detail='Order not found')
    validate_dispatch_eligibility(order)
    rider = db.riders.find_one_and_update(
        {'rider_id': payload.rider_id, 'warehouse_id': user['warehouse_id'], 'is_active': True, 'availability': 'AVAILABLE'},
        {'$set': {'availability': 'ON_DELIVERY', 'updated_at': _now()}},
        return_document=True,
    )
    if rider is None:
        raise HTTPException(status_code=409, detail='Rider is unavailable or not found')

    now = _now()
    dispatch_id = f'DSP-{uuid4().hex[:10].upper()}'
    dispatch = {
        '_id': str(uuid4()),
        'dispatch_id': dispatch_id,
        'order_id': payload.order_id,
        'order_number': order.get('order_number'),
        'warehouse_id': user['warehouse_id'],
        'rider_id': rider['rider_id'],
        'rider_name': rider['name'],
        'rider_employee_id': rider.get('employee_id'),
        'route': payload.route,
        'priority': payload.priority,
        'status': 'ASSIGNED',
        'expected_delivery_at': payload.expected_delivery_at,
        'created_at': now,
        'updated_at': now,
        'status_history': [{'status': 'ASSIGNED', 'changed_at': now, 'changed_by': user['employee_id']}],
    }
    try:
        db.dispatches.insert_one(dispatch)
        updated_order = db.orders.update_one(
            {'order_id': payload.order_id, 'warehouse_id': user['warehouse_id'], 'dispatch_status': order['dispatch_status']},
            {'$set': {'dispatch_id': dispatch_id, 'dispatch_status': 'ASSIGNED', 'rider_id': rider['rider_id'], 'updated_at': now},
             '$push': {'status_history': {'status': 'ASSIGNED', 'changed_at': now, 'changed_by': user['employee_id']}}},
        )
    except PyMongoError:
        db.dispatches.delete_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
        db.riders.update_one(
            {'rider_id': payload.rider_id, 'warehouse_id': user['warehouse_id'], 'availability': 'ON_DELIVERY'},
            {'$set': {'availability': 'AVAILABLE', 'updated_at': _now()}},
        )
        raise
    if not updated_order.matched_count:
        db.dispatches.delete_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
        db.riders.update_one(
            {'rider_id': payload.rider_id, 'warehouse_id': user['warehouse_id'], 'availability': 'ON_DELIVERY'},
            {'$set': {'availability': 'AVAILABLE', 'updated_at': _now()}},
        )
        raise HTTPException(status_code=409, detail='Order was dispatched by another request')
    return serialize_document(dispatch)


@router.get('/api/dispatch')
def list_dispatches(
    status: Optional[str] = None,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    query: dict[str, object] = {'warehouse_id': user['warehouse_id']}
    if status:
        if status not in DISPATCH_STATUSES:
            raise HTTPException(status_code=422, detail='Unknown dispatch status')
        query['status'] = status
    return {'data': [serialize_document(row) for row in db.dispatches.find(query).sort('created_at', -1)]}


@router.get('/api/dispatch/eligible')
def list_dispatch_eligible_orders(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    rows = db.orders.find({
        'warehouse_id': user['warehouse_id'],
        'packing_status': 'COMPLETED',
        'dispatch_status': {'$in': ['NOT_DISPATCHED', 'READY_FOR_DISPATCH']},
        '$or': [{'inspection_decision': 'ACCEPT'}, {'review_approved': True}],
    }).sort('created_at', 1)
    return {'data': [serialize_order(row) for row in rows]}


@router.get('/api/dispatch/{dispatch_id}')
def get_dispatch(
    dispatch_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    row = db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
    if row is None:
        raise HTTPException(status_code=404, detail='Dispatch not found')
    return serialize_document(row)


@router.patch('/api/dispatch/{dispatch_id}/status')
def update_dispatch_status(
    dispatch_id: str,
    payload: DispatchStatusUpdate,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'DISPATCH_MANAGER', 'RIDER')
    dispatch = db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
    if dispatch is None:
        raise HTTPException(status_code=404, detail='Dispatch not found')
    if user.get('role') == 'RIDER' and dispatch.get('rider_id') != user.get('employee_id') and dispatch.get('rider_employee_id') != user.get('employee_id'):
        raise HTTPException(status_code=403, detail='Riders may update only their assigned dispatches')
    transitions = {
        'ASSIGNED': {'DISPATCHED', 'CANCELLED'},
        'DISPATCHED': {'IN_TRANSIT', 'DELAYED', 'CANCELLED'},
        'IN_TRANSIT': {'DELAYED', 'DELIVERED', 'FAILED'},
        'DELAYED': {'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'},
    }
    if payload.status not in transitions.get(str(dispatch['status']), set()):
        raise HTTPException(status_code=409, detail='Invalid dispatch status transition')
    now = _now()
    _record_status(dispatch, payload.status, user)
    if payload.status == 'DISPATCHED':
        dispatch['dispatched_at'] = now
    if payload.status == 'DELIVERED':
        dispatch['delivered_at'] = now
    db.dispatches.replace_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}, dispatch)
    db.orders.update_one(
        {'order_id': dispatch['order_id'], 'warehouse_id': user['warehouse_id']},
        {'$set': {'dispatch_status': payload.status, 'updated_at': now, **({'delivered_at': now} if payload.status == 'DELIVERED' else {})},
         '$push': {'status_history': {'status': payload.status, 'changed_at': now, 'changed_by': user['employee_id']}}},
    )
    if payload.status in {'DELIVERED', 'FAILED', 'CANCELLED'}:
        db.riders.update_one(
            {'rider_id': dispatch['rider_id'], 'warehouse_id': user['warehouse_id']},
            {'$set': {'availability': 'AVAILABLE', 'updated_at': now}},
        )
    if payload.status in {'DELAYED', 'FAILED'}:
        _alert(db, user['warehouse_id'], 'DELIVERY', 'WARNING' if payload.status == 'DELAYED' else 'CRITICAL',
               f'Dispatch {dispatch_id} is {payload.status.lower()}.', str(dispatch['order_id']), dispatch_id)
    return serialize_document(dispatch)


@router.get('/api/delivery/{dispatch_id}')
def get_delivery(
    dispatch_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    dispatch = db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
    if dispatch is None:
        raise HTTPException(status_code=404, detail='Delivery not found')
    latest = db.delivery_tracking.find_one({'dispatch_id': dispatch_id}, sort=[('created_at', -1)])
    return {'dispatch': serialize_document(dispatch), 'latest_location': serialize_document(latest) if latest else None,
            'location_source': latest.get('source') if latest else None}


@router.get('/api/delivery/{dispatch_id}/history')
def get_delivery_history(
    dispatch_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    dispatch = db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
    if dispatch is None:
        raise HTTPException(status_code=404, detail='Delivery not found')
    locations = db.delivery_tracking.find(
        {'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}
    ).sort('created_at', 1).limit(1000)
    temperatures = db.temperature_readings.find(
        {'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}
    ).sort('created_at', 1).limit(1000)
    events = db.transit_events.find(
        {'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}
    ).sort('created_at', 1).limit(1000)
    return {
        'locations': [serialize_document(row) for row in locations],
        'temperatures': [serialize_document(row) for row in temperatures],
        'events': [serialize_document(row) for row in events],
    }


@router.post('/api/delivery/{dispatch_id}/location', status_code=201)
def add_delivery_location(
    dispatch_id: str,
    payload: LocationInput,
    device_token: Optional[str] = Header(default=None, alias='X-Device-Token'),
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'DISPATCH_MANAGER', 'RIDER')
    dispatch = db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
    if dispatch is None:
        raise HTTPException(status_code=404, detail='Dispatch not found')
    if dispatch.get('status') not in {'DISPATCHED', 'IN_TRANSIT', 'DELAYED'}:
        raise HTTPException(status_code=409, detail='Location updates require an active delivery')
    if user.get('role') == 'RIDER' and dispatch.get('rider_id') != user.get('employee_id'):
        if dispatch.get('rider_employee_id') != user.get('employee_id'):
            raise HTTPException(status_code=403, detail='Riders may update only their assigned dispatches')
    _require_trusted_device(payload.source, device_token)
    record = {
        '_id': str(uuid4()),
        'dispatch_id': dispatch_id,
        'order_id': dispatch['order_id'],
        'warehouse_id': user['warehouse_id'],
        'latitude': payload.latitude,
        'longitude': payload.longitude,
        'source': payload.source,
        'created_at': _now(),
        'submitted_by': user['employee_id'],
    }
    db.delivery_tracking.insert_one(record)
    return serialize_document(record)


@router.post('/api/temperature/readings', status_code=201)
def add_temperature_reading(
    dispatch_id: str = Query(min_length=1),
    payload: TemperatureInput = ...,
    device_token: Optional[str] = Header(default=None, alias='X-Device-Token'),
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'DISPATCH_MANAGER', 'RIDER')
    dispatch = db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
    if dispatch is None:
        raise HTTPException(status_code=404, detail='Dispatch not found')
    if user.get('role') == 'RIDER' and dispatch.get('rider_id') != user.get('employee_id') and dispatch.get('rider_employee_id') != user.get('employee_id'):
        raise HTTPException(status_code=403, detail='Riders may update only their assigned dispatches')
    _require_trusted_device(payload.source, device_token)
    threshold = db.warehouses.find_one({'warehouse_id': user['warehouse_id']}, {'temperature_thresholds': 1})
    thresholds = (threshold or {}).get('temperature_thresholds', {})
    order = db.orders.find_one({'order_id': dispatch['order_id'], 'warehouse_id': user['warehouse_id']})
    order_items = order.get('items', []) if order else []
    category = str(order_items[0].get('category', 'DEFAULT')) if order_items and isinstance(order_items[0], dict) else 'DEFAULT'
    range_for_category = thresholds.get(category.upper(), thresholds.get('DEFAULT', {}))
    minimum = float(range_for_category.get('min', settings.temperature_min_c))
    maximum = float(range_for_category.get('max', settings.temperature_max_c))
    if minimum >= maximum:
        raise HTTPException(status_code=500, detail='Configured temperature range is invalid')
    value = payload.temperature_c
    margin = settings.temperature_critical_margin_c
    status = 'CRITICAL' if value < minimum - margin or value > maximum + margin else 'WARNING' if value < minimum or value > maximum else 'NORMAL'
    reading = {
        '_id': str(uuid4()),
        'reading_id': f'TMP-{uuid4().hex[:10].upper()}',
        'dispatch_id': dispatch_id,
        'order_id': dispatch['order_id'],
        'warehouse_id': user['warehouse_id'],
        'temperature_c': value,
        'minimum_c': minimum,
        'maximum_c': maximum,
        'status': status,
        'source': payload.source,
        'created_at': _now(),
    }
    db.temperature_readings.insert_one(reading)
    if status != 'NORMAL':
        _alert(db, user['warehouse_id'], 'TEMPERATURE', status, f'Temperature {value:.1f}°C is outside the configured {minimum:.1f}–{maximum:.1f}°C range.',
               str(dispatch['order_id']), dispatch_id)
    return serialize_document(reading)


@router.get('/api/temperature/{dispatch_id}')
def get_temperature_history(
    dispatch_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    if db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}) is None:
        raise HTTPException(status_code=404, detail='Dispatch not found')
    rows = db.temperature_readings.find({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}).sort('created_at', -1).limit(500)
    return {'data': [serialize_document(row) for row in rows]}


@router.post('/api/transit/{dispatch_id}/events', status_code=201)
def add_transit_event(
    dispatch_id: str,
    payload: TransitEventInput,
    device_token: Optional[str] = Header(default=None, alias='X-Device-Token'),
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'DISPATCH_MANAGER', 'RIDER')
    dispatch = db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']})
    if dispatch is None:
        raise HTTPException(status_code=404, detail='Dispatch not found')
    if user.get('role') == 'RIDER' and dispatch.get('rider_id') != user.get('employee_id') and dispatch.get('rider_employee_id') != user.get('employee_id'):
        raise HTTPException(status_code=403, detail='Riders may update only their assigned dispatches')
    _require_trusted_device(payload.source, device_token)
    severity = classify_transit_event(payload.event_type, payload.magnitude)
    event = {
        '_id': str(uuid4()),
        'event_id': f'TEV-{uuid4().hex[:10].upper()}',
        'dispatch_id': dispatch_id,
        'order_id': dispatch['order_id'],
        'warehouse_id': user['warehouse_id'],
        **payload.model_dump(),
        'severity': severity,
        'created_at': _now(),
    }
    db.transit_events.insert_one(event)
    counts = list(db.transit_events.aggregate([
        {'$match': {'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}},
        {'$group': {
            '_id': None,
            'warnings': {'$sum': {'$cond': [{'$eq': ['$severity', 'WARNING']}, 1, 0]}},
            'critical': {'$sum': {'$cond': [{'$eq': ['$severity', 'CRITICAL']}, 1, 0]}},
        }},
    ]))
    event_counts = counts[0] if counts else {'warnings': 0, 'critical': 0}
    integrity_score = max(0, 100 - int(event_counts['warnings']) * 10 - int(event_counts['critical']) * 25)
    db.dispatches.update_one(
        {'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']},
        {'$set': {'integrity_score': integrity_score, 'updated_at': _now()}},
    )
    if severity != 'INFO':
        _alert(db, user['warehouse_id'], 'TRANSIT', severity, payload.description, str(dispatch['order_id']), dispatch_id)
    return serialize_document(event)


@router.get('/api/transit/{dispatch_id}/events')
def list_transit_events(
    dispatch_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    if db.dispatches.find_one({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}) is None:
        raise HTTPException(status_code=404, detail='Dispatch not found')
    rows = db.transit_events.find({'dispatch_id': dispatch_id, 'warehouse_id': user['warehouse_id']}).sort('created_at', -1)
    return {'data': [serialize_document(row) for row in rows]}


@router.get('/api/alerts')
def list_alerts(
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    query = {'warehouse_id': user['warehouse_id'], **_alert_role_filter(user)}
    return {'data': [serialize_document(row) for row in db.alerts.find(query).sort('created_at', -1).limit(500)]}


@router.patch('/api/alerts/{alert_id}/acknowledge')
def acknowledge_alert(
    alert_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    result = db.alerts.update_one(
        {'alert_id': alert_id, 'warehouse_id': user['warehouse_id'], **_alert_role_filter(user)},
        {'$set': {'is_read': True, 'acknowledged_by': user['employee_id'], 'acknowledged_at': _now()}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail='Alert not found')
    return {'success': True}


@router.patch('/api/alerts/{alert_id}/resolve')
def resolve_alert(
    alert_id: str,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    result = db.alerts.update_one(
        {'alert_id': alert_id, 'warehouse_id': user['warehouse_id'], **_alert_role_filter(user)},
        {'$set': {'is_resolved': True, 'resolved_by': user['employee_id'], 'resolved_at': _now()}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail='Alert not found')
    return {'success': True}


@router.get('/api/customer/orders/{tracking_id}')
def customer_tracking(tracking_id: str, db: Database[dict[str, object]] = Depends(get_db)):
    order = db.orders.find_one({'tracking_id': tracking_id})
    if order is None:
        raise HTTPException(status_code=404, detail='Tracking record not found')
    dispatch = db.dispatches.find_one({'dispatch_id': order.get('dispatch_id')}) if order.get('dispatch_id') else None
    latest_location = db.delivery_tracking.find_one({'dispatch_id': order.get('dispatch_id')}, sort=[('created_at', -1)]) if dispatch else None
    return {
        'order_number': order['order_number'],
        'status': order.get('dispatch_status'),
        'inspection_status': order.get('inspection_status'),
        'packing_status': order.get('packing_status'),
        'expected_delivery_at': dispatch.get('expected_delivery_at') if dispatch else None,
        'delivered_at': order.get('delivered_at'),
        'location': ({'latitude': latest_location['latitude'], 'longitude': latest_location['longitude'], 'source': latest_location['source']} if latest_location else None),
        'feedback_available': (
            order.get('dispatch_status') == 'DELIVERED'
            and db.customer_feedback.find_one({'order_id': order['order_id']}) is None
        ),
    }


@router.post('/api/customer/feedback', status_code=201)
def submit_customer_feedback(payload: CustomerFeedbackInput, db: Database[dict[str, object]] = Depends(get_db)):
    order = db.orders.find_one({'tracking_id': payload.tracking_id})
    if order is None:
        raise HTTPException(status_code=404, detail='Tracking record not found')
    if order.get('dispatch_status') != 'DELIVERED':
        raise HTTPException(status_code=409, detail='Feedback is available after delivery')
    if db.customer_feedback.find_one({'order_id': order['order_id']}) is not None:
        raise HTTPException(status_code=409, detail='Feedback has already been submitted')
    feedback = {
        '_id': str(uuid4()),
        'feedback_id': f'FDB-{uuid4().hex[:10].upper()}',
        'order_id': order['order_id'],
        'warehouse_id': order['warehouse_id'],
        'rating': payload.rating,
        'comment': payload.comment,
        'created_at': _now(),
    }
    try:
        db.customer_feedback.insert_one(feedback)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail='Feedback has already been submitted') from exc
    return {'feedback_id': feedback['feedback_id'], 'created_at': feedback['created_at']}


def recommend_packaging(order: dict[str, object]) -> dict[str, str]:
    items = order.get('items', [])
    categories = {str(item.get('category', '')).upper() for item in items if isinstance(item, dict)}
    if len(categories) > 1:
        package, reason = 'SEPARATED_CORRUGATED', 'Separate product categories to reduce cross-contact and pressure damage.'
    elif categories & {'LEAFY_GREENS', 'BERRIES'}:
        package, reason = 'VENTILATED_CUSHIONED_TRAY', 'Use ventilation and cushioning for delicate produce.'
    else:
        package, reason = 'PROTECTIVE_CORRUGATED', 'Use a protective produce carton matched to the inspected goods.'
    return {'packaging_type': package, 'reason': reason, 'source': 'RULE_BASED'}


def classify_transit_event(event_type: str, magnitude: Optional[float]) -> str:
    if magnitude is None:
        return 'WARNING'
    if event_type in {'SHOCK', 'VIBRATION', 'SUDDEN_MOVEMENT'}:
        if magnitude >= settings.shock_critical_g:
            return 'CRITICAL'
        return 'WARNING' if magnitude >= settings.shock_warning_g else 'INFO'
    if event_type == 'TILT':
        return 'CRITICAL' if magnitude >= 45 else 'WARNING' if magnitude >= 30 else 'INFO'
    return 'CRITICAL' if magnitude >= 60 else 'WARNING' if magnitude >= 15 else 'INFO'


def serialize_order(record: dict[str, object]) -> dict[str, object]:
    result = serialize_document(record)
    result.pop('tracking_id', None)
    return result


def serialize_document(record: Optional[dict[str, object]]) -> dict[str, object]:
    if record is None:
        return {}
    return {key: value for key, value in record.items() if key != '_id'}
