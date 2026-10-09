"""Create FreshGuard core tables.

Revision ID: 0001_initial_schema
Revises:
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('warehouses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.String(length=32), nullable=False),
        sa.Column('name', sa.String(length=160), nullable=False),
        sa.Column('location', sa.String(length=200), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('warehouse_id'),
    )
    op.create_index('ix_warehouses_warehouse_id', 'warehouses', ['warehouse_id'], unique=False)
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.String(length=32), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=160), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_employee_id', 'users', ['employee_id'], unique=False)
    op.create_index('ix_users_warehouse_id', 'users', ['warehouse_id'], unique=False)
    op.create_table('inspections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('inspection_id', sa.String(length=40), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('inspection_type', sa.String(length=16), nullable=False),
        sa.Column('batch_id', sa.String(length=80), nullable=True),
        sa.Column('image_path', sa.String(length=500), nullable=False),
        sa.Column('product', sa.String(length=120), nullable=True),
        sa.Column('condition', sa.String(length=32), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('grade', sa.String(length=8), nullable=True),
        sa.Column('decision', sa.String(length=24), nullable=True),
        sa.Column('defects', sa.JSON(), nullable=False),
        sa.Column('model_details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id']),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('inspection_id'),
    )
    op.create_index('ix_inspections_inspection_id', 'inspections', ['inspection_id'], unique=False)
    op.create_index('ix_inspections_employee_id', 'inspections', ['employee_id'], unique=False)
    op.create_index('ix_inspections_warehouse_id', 'inspections', ['warehouse_id'], unique=False)
    op.create_index('ix_inspections_batch_id', 'inspections', ['batch_id'], unique=False)
    op.create_table('inventory',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.String(length=80), nullable=False),
        sa.Column('product', sa.String(length=120), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('batch_id'),
    )
    op.create_index('ix_inventory_batch_id', 'inventory', ['batch_id'], unique=False)
    op.create_index('ix_inventory_product', 'inventory', ['product'], unique=False)
    op.create_index('ix_inventory_warehouse_id', 'inventory', ['warehouse_id'], unique=False)
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=160), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=32), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)
    op.create_table('inspection_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('inspection_id', sa.Integer(), nullable=False),
        sa.Column('label', sa.String(length=80), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('x', sa.Float(), nullable=True),
        sa.Column('y', sa.Float(), nullable=True),
        sa.Column('width', sa.Float(), nullable=True),
        sa.Column('height', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['inspection_id'], ['inspections.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_inspection_items_inspection_id', 'inspection_items', ['inspection_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_inspection_items_inspection_id', table_name='inspection_items')
    op.drop_table('inspection_items')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')
    op.drop_index('ix_inventory_warehouse_id', table_name='inventory')
    op.drop_index('ix_inventory_product', table_name='inventory')
    op.drop_index('ix_inventory_batch_id', table_name='inventory')
    op.drop_table('inventory')
    op.drop_index('ix_inspections_batch_id', table_name='inspections')
    op.drop_index('ix_inspections_warehouse_id', table_name='inspections')
    op.drop_index('ix_inspections_employee_id', table_name='inspections')
    op.drop_index('ix_inspections_inspection_id', table_name='inspections')
    op.drop_table('inspections')
    op.drop_index('ix_users_warehouse_id', table_name='users')
    op.drop_index('ix_users_employee_id', table_name='users')
    op.drop_table('users')
    op.drop_index('ix_warehouses_warehouse_id', table_name='warehouses')
    op.drop_table('warehouses')
