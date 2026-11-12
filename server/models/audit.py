from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    BigInteger,
    Integer,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    task_id = Column(UUID(as_uuid=True), nullable=True)
    user_id = Column(String(100), nullable=False)
    user_role = Column(String(50), nullable=False, default="OPERATOR")
    event_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(JSONB, default=dict)
    prompt_hash = Column(String(64), nullable=True)
    response_hash = Column(String(64), nullable=True)
    previous_hash = Column(String(64), nullable=False, default="0000000000000000000000000000000000000000000000000000000000000000")
    current_hash = Column(String(64), nullable=False)
    network_egress_bytes = Column(Integer, default=0)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
