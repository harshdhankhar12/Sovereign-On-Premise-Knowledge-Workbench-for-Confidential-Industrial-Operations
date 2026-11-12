from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class ApprovalDraftRequest(BaseModel):
    action_type: str = Field(default="MOC_PROPOSAL")
    title: str
    plant_unit: str = Field(default="CDU-1")
    prompt: str
    user_id: str = Field(default="lead_engineer")
    sandbox_run_id: Optional[UUID] = None

class ApprovalActionRequest(BaseModel):
    action: str = Field(default="APPROVE")
    engineer_edits: Optional[str] = None
    reviewer_id: str = Field(default="plant_manager")
    reviewer_role: str = Field(default="PLANT_MANAGER")
    review_notes: Optional[str] = None

class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: Optional[UUID] = None
    action_type: str
    title: Optional[str] = None
    plant_unit: Optional[str] = None
    draft_content: str
    engineer_edits: Optional[str] = None
    status: str
    reviewer_id: Optional[str] = None
    review_notes: Optional[str] = None
    signature_hash: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

class UnitMetricsItem(BaseModel):
    unit: str
    tasks_count: int
    hours_saved: float
    cost_saved_inr: float

class RoiMetricsResponse(BaseModel):
    total_tasks_automated: int
    cumulative_hours_saved: float
    cumulative_cost_saved_inr: float
    average_turnaround_seconds: float
    manual_baseline_hours: float
    speedup_percentage: float
    unit_breakdown: List[UnitMetricsItem]

