from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

from core.database import get_db
from dependencies.auth import get_current_user
from routes.workflow import _require_role

router = APIRouter(prefix='/api/analytics', tags=['Analytics'])


def _date_query(warehouse_id: object, date_from: Optional[datetime], date_to: Optional[datetime]) -> dict[str, object]:
    query: dict[str, object] = {'warehouse_id': warehouse_id}
    period: dict[str, datetime] = {}
    if date_from is not None:
        period['$gte'] = date_from
    if date_to is not None:
        period['$lte'] = date_to
    if period:
        query['created_at'] = period
    return query


@router.get('/dashboard')
def dashboard(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER')
    created_at_filter: dict[str, datetime] = {}
    if date_from is not None:
        created_at_filter['$gte'] = date_from
    if date_to is not None:
        created_at_filter['$lte'] = date_to
    inspection_query: dict[str, object] = {'warehouse_id': user['warehouse_id']}
    order_query: dict[str, object] = {'warehouse_id': user['warehouse_id']}
    dispatch_query: dict[str, object] = {'warehouse_id': user['warehouse_id']}
    if created_at_filter:
        inspection_query['created_at'] = created_at_filter
        order_query['created_at'] = created_at_filter
        dispatch_query['created_at'] = created_at_filter
    result = next(
        db.inspections.aggregate([
            {'$match': inspection_query},
            {
                '$group': {
                    '_id': None,
                    'total': {'$sum': 1},
                    'fresh': {'$sum': {'$cond': [{'$eq': ['$decision', 'ACCEPT']}, 1, 0]}},
                    'review': {'$sum': {'$cond': [{'$eq': ['$decision', 'REVIEW']}, 1, 0]}},
                    'rejected': {'$sum': {'$cond': [{'$eq': ['$decision', 'REJECT']}, 1, 0]}},
                    'average': {'$avg': '$quality_score'},
                },
            },
        ]),
        None,
    ) or {'total': 0, 'fresh': 0, 'review': 0, 'rejected': 0, 'average': 0}
    total = int(result['total'])
    fresh = int(result['fresh'])
    rejected = int(result['rejected'])
    average = float(result.get('average') or 0)
    eligible_query: dict[str, object] = {
        **order_query,
        'packing_status': 'COMPLETED',
        'dispatch_status': {'$in': ['NOT_DISPATCHED', 'READY_FOR_DISPATCH']},
        '$or': [{'inspection_decision': 'ACCEPT'}, {'review_approved': True}],
    }
    return {
        'total_inspections': total,
        'fresh_count': fresh,
        'review_count': int(result['review']),
        'rejected_count': rejected,
        'fresh_rate': round(fresh / total * 100, 1) if total else 0,
        'reject_rate': round(rejected / total * 100, 1) if total else 0,
        'average_quality_score': round(average, 1),
        'total_orders': db.orders.count_documents(order_query),
        'packing_completed': db.orders.count_documents({**order_query, 'packing_status': 'COMPLETED'}),
        'ready_for_dispatch': db.orders.count_documents(eligible_query),
        'in_transit': db.dispatches.count_documents({**dispatch_query, 'status': {'$in': ['DISPATCHED', 'IN_TRANSIT']}}),
        'delivered': db.dispatches.count_documents({**dispatch_query, 'status': 'DELIVERED'}),
        'delayed': db.dispatches.count_documents({**dispatch_query, 'status': 'DELAYED'}),
        'temperature_alerts': db.alerts.count_documents({
            **dispatch_query,
            'category': 'TEMPERATURE',
            'is_resolved': {'$ne': True},
        }),
        'transit_alerts': db.alerts.count_documents({
            **dispatch_query,
            'category': 'TRANSIT',
            'is_resolved': {'$ne': True},
        }),
    }


@router.get('/inspections')
def inspection_analytics(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    _require_role(user, 'ADMIN', 'WAREHOUSE_EMPLOYEE', 'QUALITY_MANAGER')
    query = _date_query(user['warehouse_id'], date_from, date_to)
    rows = db.inspections.aggregate([
        {'$match': query},
        {'$group': {
            '_id': {
                'day': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$created_at'}},
                'decision': '$decision',
            },
            'count': {'$sum': 1},
            'average_quality_score': {'$avg': '$quality_score'},
        }},
        {'$sort': {'_id.day': 1, '_id.decision': 1}},
    ])
    return {'data': [
        {
            'date': row['_id']['day'],
            'decision': row['_id']['decision'],
            'count': row['count'],
            'average_quality_score': round(float(row.get('average_quality_score') or 0), 1),
        }
        for row in rows
    ]}


@router.get('/deliveries')
def delivery_analytics(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    query = _date_query(user['warehouse_id'], date_from, date_to)
    rows = db.dispatches.aggregate([
        {'$match': query},
        {'$group': {'_id': '$status', 'count': {'$sum': 1}}},
        {'$sort': {'_id': 1}},
    ])
    return {'data': [{'status': row['_id'], 'count': row['count']} for row in rows]}


@router.get('/temperature')
def temperature_analytics(
    dispatch_id: Optional[str] = Query(default=None, min_length=1),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Database[dict[str, object]] = Depends(get_db),
    user: dict[str, object] = Depends(get_current_user),
):
    query = _date_query(user['warehouse_id'], date_from, date_to)
    if dispatch_id:
        query['dispatch_id'] = dispatch_id
    return {
        'data': [
            {
                **{key: value for key, value in row.items() if key != '_id'},
                'created_at': row['created_at'].isoformat(),
            }
            for row in db.temperature_readings.find(query).sort('created_at', 1).limit(2000)
        ],
    }



