import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from server.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class EngineeringDrawing(Base):
    __tablename__ = "engineering_drawings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    drawing_number = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    plant_unit = Column(String(100), nullable=True)
    revision = Column(String(20), default="0")
    total_pages = Column(Integer, default=1)
    file_path = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    entities = relationship("DrawingEntity", back_populates="drawing", cascade="all, delete-orphan")

class DrawingEntity(Base):
    __tablename__ = "drawing_entities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drawing_id = Column(UUID(as_uuid=True), ForeignKey("engineering_drawings.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    sub_type = Column(String(50), nullable=True)
    page_number = Column(Integer, default=1)
    bbox_x0 = Column(Float, nullable=False)
    bbox_y0 = Column(Float, nullable=False)
    bbox_x1 = Column(Float, nullable=False)
    bbox_y1 = Column(Float, nullable=False)
    center_x = Column(Float, nullable=False)
    center_y = Column(Float, nullable=False)
    associated_equipment = Column(String(100), nullable=True)
    raw_text = Column(String(255), nullable=False)

    drawing = relationship("EngineeringDrawing", back_populates="entities")

