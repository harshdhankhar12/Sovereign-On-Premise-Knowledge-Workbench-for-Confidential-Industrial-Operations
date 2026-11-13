import time
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from server.core.config import settings
from server.core.database import get_db
from server.models.agent import AgentTask, TaskStep, utc_now
from server.schemas.agent import (
    AgentQueryRequest,
    AgentQueryResponse,
    AgentTaskSummary,
    AgentStepItem,
)
from server.agent.graph import SovereignAgentWorkflow

router = APIRouter(prefix="/agent", tags=["agent"])
agent_workflow = SovereignAgentWorkflow()

@router.post("/query", response_model=AgentQueryResponse)
async def query_agent(
    request: AgentQueryRequest,
    db: AsyncSession = Depends(get_db),
):
    query_str = request.prompt.strip()
    if not query_str:
        raise HTTPException(status_code=400, detail="Query prompt cannot be empty.")

    task_record = AgentTask(
        user_id=request.user_id,
        prompt=query_str,
        status="RUNNING",
        model_used=settings.LLM_MODEL,
    )
    db.add(task_record)
    await db.commit()
    await db.refresh(task_record)

    t0 = time.perf_counter()

    try:
        final_state = await agent_workflow.execute(
            prompt=query_str,
            session=db,
            task_id=str(task_record.id),
            plant_unit=request.plant_unit,
            doc_type=request.doc_type,
            user_id=request.user_id,
            top_k=request.top_k,
            formula_params=request.formula_params,
            claimed_value=request.claimed_value,
            document_id=str(request.document_id) if request.document_id else None,
            document_title=request.document_title,
        )
    except Exception as e:
        task_record.status = "FAILED"
        task_record.final_response = f"Execution failed: {str(e)}"
        task_record.completed_at = utc_now()
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")

    total_seconds = round(time.perf_counter() - t0, 2)

    for s in final_state.get("steps", []):
        step_rec = TaskStep(
            task_id=task_record.id,
            node_name=s["node"],
            step_status=s["status"],
            step_message=s["message"],
            duration_ms=s["duration_ms"],
        )
        db.add(step_rec)

    task_record.status = "COMPLETED"
    task_record.intent = final_state.get("intent")
    task_record.final_response = final_state.get("final_response")
    task_record.citations = final_state.get("citations", [])
    task_record.completed_at = utc_now()

    await db.commit()
    await db.refresh(task_record)

    steps_response = [
        AgentStepItem(
            node=st["node"],
            status=st["status"],
            message=st["message"],
            duration_ms=st["duration_ms"],
        )
        for st in final_state.get("steps", [])
    ]

    return AgentQueryResponse(
        task_id=task_record.id,
        prompt=query_str,
        intent=final_state.get("intent", "SOP_QUERY"),
        final_response=final_state.get("final_response", ""),
        citations=final_state.get("citations", []),
        sandbox_output=final_state.get("sandbox_output"),
        verification_passed=final_state.get("verification_passed"),
        steps=steps_response,
        total_duration_seconds=total_seconds,
    )

@router.get("/tasks", response_model=List[AgentTaskSummary])
async def list_agent_tasks(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AgentTask).order_by(AgentTask.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/tasks/{task_id}")
async def get_agent_task_detail(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AgentTask)
        .options(selectinload(AgentTask.steps))
        .where(AgentTask.id == task_id)
    )
    task = (await db.execute(stmt)).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Agent task not found.")

    return {
        "id": task.id,
        "user_id": task.user_id,
        "intent": task.intent,
        "prompt": task.prompt,
        "status": task.status,
        "model_used": task.model_used,
        "final_response": task.final_response,
        "citations": task.citations,
        "created_at": task.created_at,
        "completed_at": task.completed_at,
        "steps": [
            {
                "id": s.id,
                "node_name": s.node_name,
                "step_status": s.step_status,
                "step_message": s.step_message,
                "duration_ms": s.duration_ms,
                "created_at": s.created_at,
            }
            for s in task.steps
        ],
    }
