import os
import time
from uuid import UUID
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from server.core.config import settings
from server.core.database import get_db
from server.models.governance import ApprovalRequest, ProcessingMetric
from server.schemas.governance import (
    ApprovalDraftRequest,
    ApprovalActionRequest,
    ApprovalResponse,
    RoiMetricsResponse,
    UnitMetricsItem,
)
from server.governance.drafting_engine import drafting_engine, compute_approval_signature
from server.audit.ledger import audit_service

router = APIRouter(prefix="/governance", tags=["governance"])

@router.post("/draft", response_model=ApprovalResponse)
async def draft_approval_note(
    request: ApprovalDraftRequest,
    db: AsyncSession = Depends(get_db),
):
    start = time.perf_counter()

    draft_result = await drafting_engine.draft_approval_note(
        session=db,
        action_type=request.action_type,
        title=request.title,
        plant_unit=request.plant_unit,
        prompt=request.prompt,
    )

    elapsed_sec = max(0.5, time.perf_counter() - start)
    manual_mins = 45.0
    saved_mins = max(0.0, manual_mins - (elapsed_sec / 60.0))
    cost_saved = saved_mins * 25.0

    approval_rec = ApprovalRequest(
        action_type=request.action_type,
        title=request.title,
        plant_unit=request.plant_unit,
        draft_content=draft_result["draft_content"],
        status="PENDING",
        reviewer_id=None,
    )
    db.add(approval_rec)
    await db.flush()

    metric_rec = ProcessingMetric(
        task_id=None,
        task_type="ENGINEERING_DRAFT",
        plant_unit=request.plant_unit,
        total_duration_seconds=round(elapsed_sec, 2),
        manual_baseline_minutes=manual_mins,
        estimated_cost_saved_inr=round(cost_saved, 2),
    )
    db.add(metric_rec)
    await db.flush()

    await audit_service.record_event(
        session=db,
        user_id=request.user_id,
        user_role="PROCESS_ENGINEER",
        event_type="APPROVAL_DRAFT_CREATED",
        resource_id=str(approval_rec.id),
        details={
            "title": request.title,
            "action_type": request.action_type,
            "plant_unit": request.plant_unit,
            "duration_seconds": round(elapsed_sec, 2),
            "citations_count": len(draft_result.get("citations", [])),
        },
    )

    await db.commit()
    await db.refresh(approval_rec)
    return approval_rec

@router.get("/approvals", response_model=List[ApprovalResponse])
async def list_approvals(
    status: Optional[str] = Query(None),
    plant_unit: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ApprovalRequest).order_by(ApprovalRequest.created_at.desc())
    if status:
        stmt = stmt.where(ApprovalRequest.status == status.upper())
    if plant_unit:
        stmt = stmt.where(ApprovalRequest.plant_unit == plant_unit.upper())

    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/approvals/{approval_id}", response_model=ApprovalResponse)
async def get_approval(
    approval_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
    rec = (await db.execute(stmt)).scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Approval request not found.")
    return rec

@router.post("/approvals/{approval_id}/action", response_model=ApprovalResponse)
async def act_on_approval(
    approval_id: UUID,
    request: ApprovalActionRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
    rec = (await db.execute(stmt)).scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    action_norm = request.action.upper()
    if action_norm not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT.")

    new_status = "APPROVED" if action_norm == "APPROVE" else "REJECTED"
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()

    final_content = request.engineer_edits if request.engineer_edits is not None else rec.draft_content
    sig_hash = compute_approval_signature(
        approval_id=str(rec.id),
        reviewer_id=request.reviewer_id,
        status=new_status,
        content=final_content,
        reviewed_at_iso=now_iso,
    )

    rec.status = new_status
    rec.engineer_edits = request.engineer_edits
    rec.reviewer_id = request.reviewer_id
    rec.review_notes = request.review_notes
    rec.signature_hash = sig_hash
    rec.reviewed_at = now_dt

    await audit_service.record_event(
        session=db,
        user_id=request.reviewer_id,
        user_role=request.reviewer_role,
        event_type="APPROVAL_SIGN_OFF",
        resource_id=str(rec.id),
        details={
            "action": new_status,
            "title": rec.title,
            "unit": rec.plant_unit,
            "signature_hash": sig_hash,
            "review_notes": request.review_notes,
        },
    )

    await db.commit()
    await db.refresh(rec)
    return rec

@router.get("/approvals/{approval_id}/export-pdf")
async def export_approval_pdf(
    approval_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
    rec = (await db.execute(stmt)).scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    temp_pdf_path = os.path.join(settings.UPLOAD_DIR, f"approval_{rec.id}.pdf")

    approval_dict = {
        "ref_no": f"MRPL/ENG/{rec.plant_unit or 'MOC'}/{rec.created_at.year}/{str(rec.id)[:8].upper()}",
        "title": rec.title,
        "plant_unit": rec.plant_unit,
        "action_type": rec.action_type,
        "status": rec.status,
        "draft_content": rec.draft_content,
        "engineer_edits": rec.engineer_edits,
        "signature_hash": rec.signature_hash or "UNSIGNED-PENDING-REVIEW",
        "reviewer_id": rec.reviewer_id or "Pending Review",
        "reviewed_at": rec.reviewed_at.isoformat() if rec.reviewed_at else None,
    }

    drafting_engine.render_signed_pdf(approval_dict, temp_pdf_path)

    with open(temp_pdf_path, "rb") as f:
        pdf_bytes = f.read()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=MRPL_Approval_{rec.id}.pdf"},
    )

@router.get("/metrics/roi", response_model=RoiMetricsResponse)
async def get_roi_metrics(
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ProcessingMetric)
    metrics = (await db.execute(stmt)).scalars().all()

    total_tasks = len(metrics)
    if total_tasks == 0:
        return RoiMetricsResponse(
            total_tasks_automated=0,
            cumulative_hours_saved=0.0,
            cumulative_cost_saved_inr=0.0,
            average_turnaround_seconds=0.0,
            manual_baseline_hours=0.0,
            speedup_percentage=0.0,
            unit_breakdown=[],
        )

    total_saved_mins = sum(m.time_saved_minutes or 0.0 for m in metrics)
    total_cost_saved = sum(m.estimated_cost_saved_inr or 0.0 for m in metrics)
    avg_turnaround = sum(m.total_duration_seconds for m in metrics) / total_tasks
    baseline_hours = total_tasks * 0.75
    hours_saved = total_saved_mins / 60.0

    manual_total_seconds = total_tasks * 45.0 * 60.0
    actual_total_seconds = sum(m.total_duration_seconds for m in metrics)
    speedup_pct = max(0.0, ((manual_total_seconds - actual_total_seconds) / manual_total_seconds) * 100.0)

    unit_groups: Dict[str, Dict[str, Any]] = {}
    for m in metrics:
        u = m.plant_unit or "GENERAL"
        if u not in unit_groups:
            unit_groups[u] = {"tasks": 0, "saved_mins": 0.0, "cost": 0.0}
        unit_groups[u]["tasks"] += 1
        unit_groups[u]["saved_mins"] += (m.time_saved_minutes or 0.0)
        unit_groups[u]["cost"] += (m.estimated_cost_saved_inr or 0.0)

    breakdown = [
        UnitMetricsItem(
            unit=k,
            tasks_count=v["tasks"],
            hours_saved=round(v["saved_mins"] / 60.0, 1),
            cost_saved_inr=round(v["cost"], 2),
        )
        for k, v in unit_groups.items()
    ]

    return RoiMetricsResponse(
        total_tasks_automated=total_tasks,
        cumulative_hours_saved=round(hours_saved, 2),
        cumulative_cost_saved_inr=round(total_cost_saved, 2),
        average_turnaround_seconds=round(avg_turnaround, 2),
        manual_baseline_hours=round(baseline_hours, 2),
        speedup_percentage=round(speedup_pct, 1),
        unit_breakdown=breakdown,
    )
