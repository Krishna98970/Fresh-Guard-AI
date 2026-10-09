from sqlalchemy import select

from core.database import SessionLocal
from core.security import hash_password
from models import User, Warehouse


def seed() -> None:
    with SessionLocal() as db:
        warehouse = db.scalar(select(Warehouse).where(Warehouse.warehouse_id == 'WH-MTH-001'))
        if warehouse is None:
            warehouse = Warehouse(warehouse_id='WH-MTH-001', name='FreshGuard Mathura Warehouse', location='Mathura, Uttar Pradesh')
            db.add(warehouse)
            db.flush()
        user = db.scalar(select(User).where(User.employee_id == 'EMP-1001'))
        if user is None:
            db.add(User(employee_id='EMP-1001', warehouse_id=warehouse.id, name='Krishna Mishra', email='krishna@freshguard.ai', password_hash=hash_password('demo123'), role='WAREHOUSE_EMPLOYEE'))
        db.commit()


if __name__ == '__main__':
    seed()
    print('FreshGuard seed complete')
