from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class AgentQueryRequest(BaseModel):
    prompt: str
    plant_unit: Optional[str] = None
    doc_type: Optional[str] = None
    user_id: str = "engineer"
    top_k: int = Field(default=4, ge=1, le=10)
    formula_params: Optional[Dict[str, Any]] = None
    claimed_value: Optional[float] = None
    document_id: Optional[UUID] = None
    document_title: Optional[str] = None

class AgentStepItem(BaseModel):
    node: str
    status: str
    message: str
    duration_ms: int

class AgentQueryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    prompt: str
    intent: str
    final_response: str
    citations: List[str]
    sandbox_output: Optional[Dict[str, Any]] = None
    verification_passed: Optional[bool] = None
    steps: List[AgentStepItem]
    total_duration_seconds: float

class AgentTaskSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: str
    intent: Optional[str]
    prompt: str
    status: str
    model_used: str
    final_response: Optional[str]
    citations: List[str] = []
    created_at: datetime
    completed_at: Optional[datetime]
