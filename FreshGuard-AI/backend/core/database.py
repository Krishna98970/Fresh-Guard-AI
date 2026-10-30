from collections.abc import Generator

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

from core.config import settings

client: MongoClient[dict[str, object]] = MongoClient(
    settings.mongodb_uri,
    serverSelectionTimeoutMS=5000,
    tz_aware=True,
)
database: Database[dict[str, object]] = client[settings.mongodb_database]


def get_db() -> Generator[Database[dict[str, object]], None, None]:
    yield database


def ensure_indexes(db: Database[dict[str, object]] = database) -> None:
    db.warehouses.create_index([('warehouse_id', ASCENDING)], unique=True)
    db.users.create_index([('employee_id', ASCENDING)], unique=True)
    db.users.create_index(
        [('email', ASCENDING)],
        unique=True,
        partialFilterExpression={'email': {'$type': 'string'}},
    )
    db.inspections.create_index([('inspection_id', ASCENDING)], unique=True)
    db.inspections.create_index([('warehouse_id', ASCENDING), ('created_at', DESCENDING)])
    db.inventory.create_index([('batch_id', ASCENDING)], unique=True)
    db.inventory.create_index([('warehouse_id', ASCENDING), ('received_at', DESCENDING)])
    db.notifications.create_index([('user_id', ASCENDING), ('created_at', DESCENDING)])
    db.orders.create_index([('order_id', ASCENDING)], unique=True)
    db.orders.create_index([('order_number', ASCENDING)], unique=True)
    db.orders.create_index([('tracking_id', ASCENDING)], unique=True)
    db.orders.create_index([('warehouse_id', ASCENDING), ('created_at', DESCENDING)])
    db.packing_records.create_index([('order_id', ASCENDING)], unique=True)
    db.packing_records.create_index([('warehouse_id', ASCENDING), ('status', ASCENDING)])
    db.riders.create_index([('warehouse_id', ASCENDING), ('rider_id', ASCENDING)], unique=True)
    db.dispatches.create_index([('dispatch_id', ASCENDING)], unique=True)
    db.dispatches.create_index([('order_id', ASCENDING)], unique=True)
    db.dispatches.create_index([('warehouse_id', ASCENDING), ('status', ASCENDING)])
    db.delivery_tracking.create_index([('dispatch_id', ASCENDING), ('created_at', DESCENDING)])
    db.temperature_readings.create_index([('dispatch_id', ASCENDING), ('created_at', DESCENDING)])
    db.transit_events.create_index([('dispatch_id', ASCENDING), ('created_at', DESCENDING)])
    db.alerts.create_index([('warehouse_id', ASCENDING), ('created_at', DESCENDING)])
    db.customer_feedback.create_index([('order_id', ASCENDING)], unique=True)
