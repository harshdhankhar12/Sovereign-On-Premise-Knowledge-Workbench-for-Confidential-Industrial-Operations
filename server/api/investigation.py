import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from server.core.config import settings
from server.core.database import get_db
from server.models.investigation import ShiftHandover, RcaReport
from server.schemas.investigation import (
    ShiftHandoverCreate,
    ShiftHandoverCountersign,
    ShiftHandoverResponse,
    RcaGenerateRequest,
    RcaReportResponse,
    RcaPresetItem,
)
from server.investigation.rca_engine import rca_engine
from server.audit.ledger import audit_service

router = APIRouter(prefix="/investigation", tags=["investigation"])

@router.get("/rca/presets", response_model=List[RcaPresetItem])
async def get_rca_presets():
    return rca_engine.get_presets()

@router.post("/shift-handover/generate", response_model=ShiftHandoverResponse)
async def generate_shift_handover(
    request: ShiftHandoverCreate,
    db: AsyncSession = Depends(get_db),
):
    handover = await rca_engine.generate_shift_handover(
        session=db,
        shift_type=request.shift_type,
        outgoing_operator=request.outgoing_operator,
        relieving_operator=request.relieving_operator,
    )

    await audit_service.record_event(
        session=db,
        user_id=request.outgoing_operator,
        user_role="Shift Lead",
        event_type="SHIFT_HANDOVER_GENERATED",
        resource_id=str(handover.id),
        details={
            "shift_type": handover.shift_type,
            "events_count": handover.events_count,
            "outgoing_signature": handover.outgoing_signature,
        },
    )
    await db.commit()

    return ShiftHandoverResponse(
        id=str(handover.id),
        shift_type=handover.shift_type,
        outgoing_operator=handover.outgoing_operator,
        relieving_operator=handover.relieving_operator,
        events_count=handover.events_count,
        critical_incidents=handover.critical_incidents,
        equipment_status=handover.equipment_status,
        pending_mocs=handover.pending_mocs,
        standing_orders=handover.standing_orders,
        handover_summary=handover.handover_summary,
        outgoing_signature=handover.outgoing_signature,
        relieving_signature=handover.relieving_signature,
        created_at=handover.created_at.isoformat(),
        countersigned_at=handover.countersigned_at.isoformat() if handover.countersigned_at else None,
    )

@router.get("/shift-handover/latest", response_model=ShiftHandoverResponse)
async def get_latest_shift_handover(
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ShiftHandover).order_by(desc(ShiftHandover.created_at)).limit(1)
    handover = (await db.execute(stmt)).scalar_one_or_none()
    if not handover:
        raise HTTPException(status_code=404, detail="No shift handover records found.")

    return ShiftHandoverResponse(
        id=str(handover.id),
        shift_type=handover.shift_type,
        outgoing_operator=handover.outgoing_operator,
        relieving_operator=handover.relieving_operator,
        events_count=handover.events_count,
        critical_incidents=handover.critical_incidents,
        equipment_status=handover.equipment_status,
        pending_mocs=handover.pending_mocs,
        standing_orders=handover.standing_orders,
        handover_summary=handover.handover_summary,
        outgoing_signature=handover.outgoing_signature,
        relieving_signature=handover.relieving_signature,
        created_at=handover.created_at.isoformat(),
        countersigned_at=handover.countersigned_at.isoformat() if handover.countersigned_at else None,
    )

@router.post("/shift-handover/{handover_id}/countersign", response_model=ShiftHandoverResponse)
async def countersign_shift_handover(
    handover_id: uuid.UUID,
    request: ShiftHandoverCountersign,
    db: AsyncSession = Depends(get_db),
):
    try:
        handover = await rca_engine.countersign_handover(
            session=db,
            handover_id=handover_id,
            relieving_operator=request.relieving_operator,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await audit_service.record_event(
        session=db,
        user_id=request.relieving_operator,
        user_role="Relief In-Charge",
        event_type="SHIFT_HANDOVER_COUNTERSIGNED",
        resource_id=str(handover.id),
        details={
            "relieving_operator": handover.relieving_operator,
            "relieving_signature": handover.relieving_signature,
        },
    )
    await db.commit()

    return ShiftHandoverResponse(
        id=str(handover.id),
        shift_type=handover.shift_type,
        outgoing_operator=handover.outgoing_operator,
        relieving_operator=handover.relieving_operator,
        events_count=handover.events_count,
        critical_incidents=handover.critical_incidents,
        equipment_status=handover.equipment_status,
        pending_mocs=handover.pending_mocs,
        standing_orders=handover.standing_orders,
        handover_summary=handover.handover_summary,
        outgoing_signature=handover.outgoing_signature,
        relieving_signature=handover.relieving_signature,
        created_at=handover.created_at.isoformat(),
        countersigned_at=handover.countersigned_at.isoformat() if handover.countersigned_at else None,
    )

@router.get("/shift-handover/{handover_id}/export-pdf")
async def export_handover_pdf(
    handover_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ShiftHandover).where(ShiftHandover.id == handover_id)
    handover = (await db.execute(stmt)).scalar_one_or_none()
    if not handover:
        raise HTTPException(status_code=404, detail="Shift handover log not found.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    temp_pdf_path = os.path.join(settings.UPLOAD_DIR, f"handover_{handover.id}.pdf")

    handover_dict = {
        "id": str(handover.id),
        "shift_type": handover.shift_type,
        "outgoing_operator": handover.outgoing_operator,
        "relieving_operator": handover.relieving_operator,
        "events_count": handover.events_count,
        "handover_summary": handover.handover_summary,
        "outgoing_signature": handover.outgoing_signature,
        "relieving_signature": handover.relieving_signature,
        "created_at": handover.created_at.isoformat(),
    }
    rca_engine.render_handover_pdf(handover_dict, temp_pdf_path)

    with open(temp_pdf_path, "rb") as f:
        pdf_bytes = f.read()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="MRPL-ShiftHandover-{handover.shift_type}-{str(handover.id)[:8].upper()}.pdf"'
        },
    )

@router.post("/rca/generate", response_model=RcaReportResponse)
async def generate_rca_report(
    request: RcaGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    report = await rca_engine.generate_5why_rca(
        session=db,
        request_data=request.model_dump(),
    )

    await audit_service.record_event(
        session=db,
        user_id=request.investigator_id,
        user_role="Lead Investigator",
        event_type="INCIDENT_5WHY_RCA_GENERATED",
        resource_id=str(report.id),
        details={
            "incident_title": report.incident_title,
            "plant_unit": report.plant_unit,
            "signature_hash": report.signature_hash,
            "why_count": len(report.why_steps),
            "capa_count": len(report.capa_items),
        },
    )
    await db.commit()

    return RcaReportResponse(
        id=str(report.id),
        incident_title=report.incident_title,
        plant_unit=report.plant_unit,
        triggering_tag=report.triggering_tag,
        sop_reference=report.sop_reference,
        problem_statement=report.problem_statement,
        why_steps=report.why_steps,
        capa_items=report.capa_items,
        formal_analysis=report.formal_analysis,
        investigator_id=report.investigator_id,
        signature_hash=report.signature_hash,
        created_at=report.created_at.isoformat(),
    )

@router.get("/rca/{rca_id}/export-pdf")
async def export_rca_pdf(
    rca_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RcaReport).where(RcaReport.id == rca_id)
    report = (await db.execute(stmt)).scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="RCA report not found.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    temp_pdf_path = os.path.join(settings.UPLOAD_DIR, f"rca_{report.id}.pdf")

    rca_dict = {
        "id": str(report.id),
        "incident_title": report.incident_title,
        "plant_unit": report.plant_unit,
        "triggering_tag": report.triggering_tag,
        "sop_reference": report.sop_reference,
        "formal_analysis": report.formal_analysis,
        "investigator_id": report.investigator_id,
        "signature_hash": report.signature_hash,
    }
    rca_engine.render_rca_pdf(rca_dict, temp_pdf_path)

    with open(temp_pdf_path, "rb") as f:
        pdf_bytes = f.read()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="MRPL-5WhyRCA-{report.plant_unit}-{str(report.id)[:8].upper()}.pdf"'
        },
    )
