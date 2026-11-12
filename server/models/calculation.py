import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    Float,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from server.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class CalculationRun(Base):
    __tablename__ = "calculation_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id", ondelete="CASCADE"), nullable=True)
    formula_name = Column(String(100), nullable=False)
    python_code = Column(Text, nullable=False)
    input_params = Column(JSONB, nullable=False)
    calculated_output = Column(JSONB, nullable=True)
    claimed_value = Column(Float, nullable=True)
    discrepancy_pct = Column(Float, nullable=True)
    verification_passed = Column(Boolean, default=False)
    execution_time_ms = Column(Integer, nullable=False)
    sandbox_status = Column(String(50), nullable=False)
    executed_at = Column(DateTime(timezone=True), default=utc_now)

    task = relationship("AgentTask", back_populates="calculation_runs")
