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
    database.users.update_one(
        {'employee_id': 'EMP-1001'},
        {
            '$setOnInsert': {
                'employee_id': 'EMP-1001',
                'warehouse_id': 'WH-MTH-001',
                'name': 'Krishna Mishra',
                'email': 'krishna@freshguard.ai',
                'password_hash': hash_password('demo123'),
                'role': 'WAREHOUSE_EMPLOYEE',
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
