from datetime import datetime, timezone

from core.database import database, ensure_indexes
from core.security import hash_password


def seed() -> None:
    ensure_indexes(database)
    now = datetime.now(timezone.utc)
    database.warehouses.update_one(
        {'warehouse_id': 'WH-MTH-001'},
        {
            '$setOnInsert': {
                'warehouse_id': 'WH-MTH-001',
                'name': 'FreshGuard Mathura Warehouse',
                'location': 'Mathura, Uttar Pradesh',
                'is_active': True,
                'created_at': now,
            },
        },
        upsert=True,
    )
    demo_users = [
        ('EMP-1001', 'Krishna Mishra', 'krishna@freshguard.ai', 'DISPATCH_MANAGER'),
        ('EMP-1002', 'Quality Manager', 'quality@freshguard.ai', 'QUALITY_MANAGER'),
        ('EMP-1003', 'Dispatch Manager', 'dispatch@freshguard.ai', 'DISPATCH_MANAGER'),
        ('EMP-1004', 'Demo Rider', 'rider@freshguard.ai', 'RIDER'),
        ('EMP-1005', 'Warehouse Administrator', 'admin@freshguard.ai', 'ADMIN'),
    ]
    for employee_id, name, email, role in demo_users:
        database.users.update_one(
            {'employee_id': employee_id},
            {
                '$set': {'role': role},
                '$setOnInsert': {
                    'employee_id': employee_id,
                    'warehouse_id': 'WH-MTH-001',
                    'name': name,
                    'email': email,
                    'password_hash': hash_password('demo123'),
                    'is_active': True,
                    'created_at': now,
                    'updated_at': now,
                },
            },
            upsert=True,
        )
    database.riders.update_one(
        {'rider_id': 'EMP-1004', 'warehouse_id': 'WH-MTH-001'},
        {
            '$setOnInsert': {
                '_id': 'rider-demo-1004',
                'rider_id': 'EMP-1004',
                'employee_id': 'EMP-1004',
                'warehouse_id': 'WH-MTH-001',
                'name': 'Demo Rider',
                'phone': 'Not configured',
                'availability': 'AVAILABLE',
                'is_active': True,
                'created_at': now,
                'updated_at': now,
            },
        },
        upsert=True,
    )


if __name__ == '__main__':
    seed()
    print('FreshGuard seed complete')
