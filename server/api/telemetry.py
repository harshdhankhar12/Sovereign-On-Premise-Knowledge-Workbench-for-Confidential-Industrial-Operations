from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from server.core.database import get_db
from server.audit.ledger import audit_service
from server.schemas.telemetry import (
    TelemetrySnapshot,
    FaultInjectionRequest,
    AlarmsResponse,
    StepAcknowledgeRequest,
    ChecklistStep,
)
from server.telemetry.dcs_simulator import dcs_simulator
from server.telemetry.checklist_engine import checklist_engine

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.get("/live", response_model=TelemetrySnapshot)
async def get_live_telemetry():
    return dcs_simulator.get_snapshot()

@router.post("/inject-fault", response_model=TelemetrySnapshot)
async def inject_fault(
    request: FaultInjectionRequest,
    db: AsyncSession = Depends(get_db),
):
    dcs_simulator.inject_fault(request.fault_type)
    snapshot = dcs_simulator.get_snapshot()
    
    await audit_service.record_event(
        session=db,
        user_id="operator_01",
        user_role="Operator",
        event_type="FAULT_INJECTION_SIMULATION",
        resource_id=request.fault_type,
        details={
            "fault_type": request.fault_type,
            "overall_status": snapshot.overall_status,
            "active_alarms_count": snapshot.active_alarms_count,
        },
    )
    await db.commit()
    return snapshot

@router.post("/reset", response_model=TelemetrySnapshot)
async def reset_telemetry(
    db: AsyncSession = Depends(get_db),
):
    dcs_simulator.reset()
    checklist_engine.reset_step_acknowledgments()
    snapshot = dcs_simulator.get_snapshot()

    await audit_service.record_event(
        session=db,
        user_id="operator_01",
        user_role="Operator",
        event_type="TELEMETRY_RESET_NOMINAL",
        resource_id="ALL_UNITS",
        details={
            "overall_status": snapshot.overall_status,
        },
    )
    await db.commit()
    return snapshot

@router.get("/alarms", response_model=AlarmsResponse)
async def get_active_alarms():
    snapshot = dcs_simulator.get_snapshot()
    return checklist_engine.evaluate_alarms_and_checklists(snapshot)

@router.post("/acknowledge-step", response_model=ChecklistStep)
async def acknowledge_step(
    request: StepAcknowledgeRequest,
    db: AsyncSession = Depends(get_db),
):
    snapshot = dcs_simulator.get_snapshot()
    alarms_resp = checklist_engine.evaluate_alarms_and_checklists(snapshot)
    
    target_step = None
    target_alarm = None
    for alarm in alarms_resp.alarms:
        if alarm.alarm_id == request.alarm_id:
            for step in alarm.checklist:
                if step.step_id == request.step_id:
                    target_step = step
                    target_alarm = alarm
                    break
        if target_step:
            break

    if not target_step or not target_alarm:
        raise HTTPException(status_code=404, detail="Alarm step not found or alarm cleared.")

    ack_record = checklist_engine.acknowledge_step(
        step_id=request.step_id,
        operator_role=request.operator_role,
    )

    await audit_service.record_event(
        session=db,
        user_id="operator_01",
        user_role=request.operator_role,
        event_type="EMERGENCY_SOP_STEP_ACKNOWLEDGED",
        resource_id=request.step_id,
        details={
            "alarm_id": request.alarm_id,
            "step_id": request.step_id,
            "action": target_step.action,
            "sop_reference": target_step.sop_reference,
            "associated_tags": target_step.associated_tags,
            "completed_by": request.operator_role,
        },
    )
    await db.commit()

    return ChecklistStep(
        step_id=target_step.step_id,
        sequence=target_step.sequence,
        priority=target_step.priority,
        time_window=target_step.time_window,
        action=target_step.action,
        sop_reference=target_step.sop_reference,
        clearance_required=target_step.clearance_required,
        associated_tags=target_step.associated_tags,
        completed=True,
        completed_at=ack_record["completed_at"],
        completed_by=request.operator_role,
    )

