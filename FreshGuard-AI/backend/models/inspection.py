from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class Inspection(Base):
    __tablename__ = 'inspections'

    id: Mapped[int] = mapped_column(primary_key=True)
    inspection_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey('users.id'), index=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey('warehouses.id'), index=True)
    inspection_type: Mapped[str] = mapped_column(String(16), default='single', nullable=False)
    batch_id: Mapped[Optional[str]] = mapped_column(String(80), index=True, nullable=True)
    image_path: Mapped[str] = mapped_column(String(500))
    product: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    condition: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quality_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    grade: Mapped[Optional[str]] = mapped_column(String(8), nullable=True)
    decision: Mapped[Optional[str]] = mapped_column(String(24), nullable=True)
    defects: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    model_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    employee: Mapped['User'] = relationship(back_populates='inspections')
    warehouse: Mapped['Warehouse'] = relationship(back_populates='inspections')
    items: Mapped[List['InspectionItem']] = relationship(back_populates='inspection', cascade='all, delete-orphan')


class InspectionItem(Base):
    __tablename__ = 'inspection_items'

    id: Mapped[int] = mapped_column(primary_key=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey('inspections.id'), index=True)
    label: Mapped[str] = mapped_column(String(80))
    confidence: Mapped[float] = mapped_column(Float)
    x: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    y: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    width: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    height: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    inspection: Mapped['Inspection'] = relationship(back_populates='items')
