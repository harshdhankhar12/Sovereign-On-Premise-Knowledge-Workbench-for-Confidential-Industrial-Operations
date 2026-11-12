from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class TaskSubmitRequest(BaseModel):
    task_type: Literal["AGENT_QUERY", "FORMULA_CALCULATION"] = "AGENT_QUERY"
    prompt: Optional[str] = None
    plant_unit: Optional[str] = None
    doc_type: Optional[str] = None
    user_id: str = "engineer"
    top_k: int = Field(default=4, ge=1, le=10)
    formula_name: Optional[str] = None
    formula_params: Optional[Dict[str, Any]] = None
    claimed_value: Optional[float] = None

class TaskSubmitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    task_type: str
    status: str
    queue_position: int
    ws_url: str
    submitted_at: datetime

class TaskStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task_id: UUID
    status: str
    intent: Optional[str] = None
    progress_percent: int
    current_step: Optional[str] = None
    final_response: Optional[str] = None
    citations: List[str] = []
    sandbox_output: Optional[Dict[str, Any]] = None
    verification_passed: Optional[bool] = None
    total_duration_seconds: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

class QueueStatsResponse(BaseModel):
    queue_name: str
    pending_tasks: int
    worker_running: bool
    active_channels: int

