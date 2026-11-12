import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Float,
    FetchedValue,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from server.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id", ondelete="CASCADE"), nullable=True)
    action_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=True)
    plant_unit = Column(String(100), nullable=True)
    draft_content = Column(Text, nullable=False)
    engineer_edits = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING")
    reviewer_id = Column(String(100), nullable=True)
    review_notes = Column(Text, nullable=True)
    signature_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

class ProcessingMetric(Base):
    __tablename__ = "processing_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id", ondelete="CASCADE"), nullable=True)
    task_type = Column(String(100), default="ENGINEERING_DRAFT")
    plant_unit = Column(String(100), nullable=True)
    total_duration_seconds = Column(Float, nullable=False)
    manual_baseline_minutes = Column(Float, default=45.0)
    time_saved_minutes = Column(Float, server_default=FetchedValue())
    estimated_cost_saved_inr = Column(Float, default=0.0)
    recorded_at = Column(DateTime(timezone=True), default=utc_now)
