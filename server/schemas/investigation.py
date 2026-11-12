from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ShiftHandoverCreate(BaseModel):
    shift_type: str = "MORNING"
    outgoing_operator: str = "Shift In-Charge (Process Lead)"
    relieving_operator: Optional[str] = "Relief In-Charge (Operations)"

class ShiftHandoverCountersign(BaseModel):
    relieving_operator: str = "Relief In-Charge (Operations)"

class ShiftHandoverResponse(BaseModel):
    id: str
    shift_type: str
    outgoing_operator: str
    relieving_operator: Optional[str]
    events_count: int
    critical_incidents: List[str]
    equipment_status: Dict[str, str]
    pending_mocs: List[str]
    standing_orders: List[str]
    handover_summary: str
    outgoing_signature: str
    relieving_signature: Optional[str]
    created_at: str
    countersigned_at: Optional[str]

class WhyStep(BaseModel):
    level: int
    question: str
    answer: str
    evidence_reference: str

class CapaItem(BaseModel):
    action_type: str
    description: str
    owner: str
    target_sop: str
    deadline_days: int

class RcaGenerateRequest(BaseModel):
    incident_title: str
    plant_unit: str
    triggering_tag: Optional[str] = None
    sop_reference: Optional[str] = None
    initial_observation: Optional[str] = None
    investigator_id: str = "lead_process_eng"

class RcaReportResponse(BaseModel):
    id: str
    incident_title: str
    plant_unit: str
    triggering_tag: Optional[str]
    sop_reference: Optional[str]
    problem_statement: str
    why_steps: List[WhyStep]
    capa_items: List[CapaItem]
    formal_analysis: str
    investigator_id: str
    signature_hash: str
    created_at: str

class RcaPresetItem(BaseModel):
    key: str
    incident_title: str
    plant_unit: str
    triggering_tag: str
    sop_reference: str
    initial_observation: str
