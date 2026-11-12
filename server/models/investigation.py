import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class ShiftHandover(Base):
    __tablename__ = "shift_handovers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shift_type = Column(String(50), nullable=False)
    outgoing_operator = Column(String(100), nullable=False)
    relieving_operator = Column(String(100), nullable=True)
    events_count = Column(Integer, default=0)
    critical_incidents = Column(JSONB, default=list)
    equipment_status = Column(JSONB, default=dict)
    pending_mocs = Column(JSONB, default=list)
    standing_orders = Column(JSONB, default=list)
    handover_summary = Column(Text, nullable=False)
    outgoing_signature = Column(String(64), nullable=False)
    relieving_signature = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    countersigned_at = Column(DateTime(timezone=True), nullable=True)

class RcaReport(Base):
    __tablename__ = "rca_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_title = Column(String(255), nullable=False)
    plant_unit = Column(String(100), nullable=False)
    triggering_tag = Column(String(50), nullable=True)
    sop_reference = Column(String(100), nullable=True)
    problem_statement = Column(Text, nullable=False)
    why_steps = Column(JSONB, default=list)
    capa_items = Column(JSONB, default=list)
    formal_analysis = Column(Text, nullable=False)
    investigator_id = Column(String(100), nullable=False)
    signature_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
