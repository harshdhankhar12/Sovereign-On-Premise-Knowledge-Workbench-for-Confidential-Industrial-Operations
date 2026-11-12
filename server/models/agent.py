import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    BigInteger,
    Integer,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from server.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(100), nullable=False)
    intent = Column(String(100), nullable=True)
    prompt = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING")
    model_used = Column(String(100), default="llama3.1:8b")
    final_response = Column(Text, nullable=True)
    citations = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    steps = relationship("TaskStep", back_populates="task", cascade="all, delete-orphan")
    calculation_runs = relationship("CalculationRun", back_populates="task", cascade="all, delete-orphan")

class TaskStep(Base):
    __tablename__ = "task_steps"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("agent_tasks.id", ondelete="CASCADE"), nullable=False)
    node_name = Column(String(100), nullable=False)
    step_status = Column(String(50), nullable=False)
    step_message = Column(Text, nullable=False)
    payload = Column(JSONB, default=dict)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    task = relationship("AgentTask", back_populates="steps")

