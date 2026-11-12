from datetime import datetime, timezone
from typing import Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.core.config import settings
from server.core.database import get_db
from server.core.queue import queue_manager
from server.models.agent import AgentTask
from server.worker.task_worker import task_worker, QUEUE_NAME
from server.api.websocket import manager as ws_manager
from server.schemas.tasks import (
    TaskSubmitRequest,
    TaskSubmitResponse,
    TaskStatusResponse,
    QueueStatsResponse,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

@router.post("/submit", response_model=TaskSubmitResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_task(
    request: TaskSubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    query_text = request.prompt or f"Formula execution: {request.formula_name}"

    task_record = AgentTask(
        user_id=request.user_id,
        prompt=query_text,
        status="QUEUED",
        model_used=settings.LLM_MODEL,
    )
    db.add(task_record)
    await db.commit()
    await db.refresh(task_record)

    task_payload = {
        "task_id": str(task_record.id),
        "task_type": request.task_type,
        "prompt": request.prompt,
        "plant_unit": request.plant_unit,
        "doc_type": request.doc_type,
        "user_id": request.user_id,
        "top_k": request.top_k,
        "formula_name": request.formula_name,
        "formula_params": request.formula_params,
        "claimed_value": request.claimed_value,
        "submitted_at": utc_now().isoformat(),
    }

    q_pos = await queue_manager.enqueue(QUEUE_NAME, task_payload)

    await queue_manager.set_task_state(
        str(task_record.id),
        {
            "task_id": str(task_record.id),
            "status": "QUEUED",
            "progress_percent": 10,
            "submitted_at": utc_now().isoformat(),
        }
    )

    return TaskSubmitResponse(
        task_id=task_record.id,
        task_type=request.task_type,
        status="QUEUED",
        queue_position=q_pos,
        ws_url=f"/api/v1/ws/tasks/{task_record.id}",
        submitted_at=task_record.created_at,
    )

@router.get("/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    str_id = str(task_id)
    cached_state = await queue_manager.get_task_state(str_id)

    stmt = select(AgentTask).where(AgentTask.id == task_id)
    rec = (await db.execute(stmt)).scalar_one_or_none()

    if not rec and not cached_state:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found.")

    status_str = cached_state.get("status") if cached_state else rec.status
    intent_str = cached_state.get("intent") if cached_state else (rec.intent if rec else None)
    response_str = cached_state.get("final_response") if cached_state else (rec.final_response if rec else None)
    citations_list = cached_state.get("citations") if cached_state else (rec.citations if rec and rec.citations else [])
    output_obj = cached_state.get("sandbox_output") if cached_state else None
    passed_val = cached_state.get("verification_passed") if cached_state else None
    dur_sec = cached_state.get("duration_seconds") if cached_state else None

    progress_map = {
        "QUEUED": 10,
        "RUNNING": 50,
        "COMPLETED": 100,
        "FAILED": 0,
        "CANCELLED": 0,
    }
    progress = progress_map.get(status_str, 50)

    created_dt = rec.created_at if rec else utc_now()
    completed_dt = rec.completed_at if rec else None

    return TaskStatusResponse(
        task_id=task_id,
        status=status_str,
        intent=intent_str,
        progress_percent=progress,
        current_step=status_str,
        final_response=response_str,
        citations=citations_list,
        sandbox_output=output_obj,
        verification_passed=passed_val,
        total_duration_seconds=dur_sec,
        created_at=created_dt,
        completed_at=completed_dt,
    )

@router.post("/{task_id}/cancel")
async def cancel_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    str_id = str(task_id)
    await queue_manager.set_cancel_flag(str_id)
    await queue_manager.publish_event(
        str_id,
        "TASK_CANCELLED",
        {"task_id": str_id, "message": "Task cancellation requested by user."},
    )

    stmt = select(AgentTask).where(AgentTask.id == task_id)
    rec = (await db.execute(stmt)).scalar_one_or_none()
    if rec and rec.status in ["QUEUED", "RUNNING"]:
        rec.status = "CANCELLED"
        rec.completed_at = utc_now()
        await db.commit()

    return {"task_id": str_id, "status": "CANCELLED", "message": "Cancellation flag set."}

@router.get("/queue/stats", response_model=QueueStatsResponse)
async def get_queue_stats():
    length = await queue_manager.get_queue_length(QUEUE_NAME)
    active_channels = len(ws_manager.active_connections)
    return QueueStatsResponse(
        queue_name=QUEUE_NAME,
        pending_tasks=length,
        worker_running=task_worker._running,
        active_channels=active_channels,
    )

