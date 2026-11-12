from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class SensorTag(BaseModel):
    tag: str
    name: str
    unit: str
    value: float
    nominal: float
    normal_min: float
    normal_max: float
    warning_threshold: Optional[float] = None
    trip_threshold: Optional[float] = None
    status: str
    engineering_unit: str

class UnitTelemetry(BaseModel):
    unit_id: str
    unit_name: str
    status: str
    sensors: List[SensorTag]

class TelemetrySnapshot(BaseModel):
    timestamp: str
    overall_status: str
    active_alarms_count: int
    units: List[UnitTelemetry]

class FaultInjectionRequest(BaseModel):
    fault_type: str

class ChecklistStep(BaseModel):
    step_id: str
    sequence: int
    priority: str
    time_window: str
    action: str
    sop_reference: str
    clearance_required: str
    associated_tags: List[str]
    completed: bool = False
    completed_at: Optional[str] = None
    completed_by: Optional[str] = None

class ActiveAlarm(BaseModel):
    alarm_id: str
    tag: str
    unit_id: str
    unit_name: str
    severity: str
    current_value: float
    threshold_value: float
    engineering_unit: str
    description: str
    triggered_at: str
    sop_title: str
    sop_doc_id: str
    sop_clearance: str
    connected_equipment: List[str]
    checklist: List[ChecklistStep]

class AlarmsResponse(BaseModel):
    alarms: List[ActiveAlarm]
    total_active: int

class StepAcknowledgeRequest(BaseModel):
    alarm_id: str
    step_id: str
    operator_role: str = "Operator"
