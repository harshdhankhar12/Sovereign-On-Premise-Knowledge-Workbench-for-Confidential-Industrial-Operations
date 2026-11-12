import os
import hashlib
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.core.config import settings
from server.core.database import get_db
from server.core.llm import OllamaChatService
from server.models.drawings import EngineeringDrawing, DrawingEntity
from server.drawings.pid_parser import (
    parse_drawing_entities,
    trace_equipment_network,
    render_annotated_drawing,
)
from server.schemas.drawings import (
    DrawingEntityItem,
    DrawingParseResponse,
    TraceEquipmentRequest,
    TraceEquipmentResponse,
    DrawingQARequest,
    DrawingQAResponse,
)

router = APIRouter(prefix="/drawings", tags=["drawings"])
llm_service = OllamaChatService()

@router.post("/upload-pid", response_model=DrawingParseResponse)
async def upload_pid_drawing(
    file: UploadFile = File(...),
    drawing_number: str = Form(...),
    title: str = Form(...),
    plant_unit: Optional[str] = Form(None),
    revision: str = Form("0"),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF technical drawings are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    file_hash = hashlib.sha256(file_bytes).hexdigest()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_path = os.path.join(settings.UPLOAD_DIR, f"drawing_{file_hash}_{file.filename}")
    if not os.path.exists(saved_path):
        with open(saved_path, "wb") as f:
            f.write(file_bytes)

    try:
        parsed = parse_drawing_entities(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse technical drawing: {str(e)}")

    drawing_rec = EngineeringDrawing(
        drawing_number=drawing_number,
        title=title,
        plant_unit=plant_unit,
        revision=revision,
        file_path=saved_path,
        total_pages=1,
    )
    db.add(drawing_rec)
    await db.flush()

    entity_records = []
    items = []
    for e in parsed["entities"]:
        bbox = e["bbox"]
        center = e["center"]
        ent = DrawingEntity(
            drawing_id=drawing_rec.id,
            tag=e["tag"],
            entity_type=e["entity_type"],
            sub_type=e["sub_type"],
            page_number=e["page_number"],
            bbox_x0=bbox[0],
            bbox_y0=bbox[1],
            bbox_x1=bbox[2],
            bbox_y1=bbox[3],
            center_x=center[0],
            center_y=center[1],
            raw_text=e["raw_text"],
        )
        entity_records.append(ent)
        items.append(DrawingEntityItem(
            tag=e["tag"],
            entity_type=e["entity_type"],
            sub_type=e["sub_type"],
            page_number=e["page_number"],
            bbox=bbox,
            center=center,
            raw_text=e["raw_text"],
        ))

    db.add_all(entity_records)
    await db.commit()
    await db.refresh(drawing_rec)

    return DrawingParseResponse(
        drawing_id=drawing_rec.id,
        drawing_number=drawing_rec.drawing_number,
        title=drawing_rec.title,
        plant_unit=drawing_rec.plant_unit,
        total_entities=parsed["total_entities"],
        equipment_count=parsed["equipment_count"],
        instruments_count=parsed["instruments_count"],
        valves_count=parsed["valves_count"],
        lines_count=parsed["lines_count"],
        entities=items,
        created_at=drawing_rec.created_at,
    )

@router.get("/{drawing_id}/entities", response_model=List[DrawingEntityItem])
async def get_drawing_entities(
    drawing_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DrawingEntity).where(DrawingEntity.drawing_id == drawing_id)
    records = (await db.execute(stmt)).scalars().all()

    return [
        DrawingEntityItem(
            tag=r.tag,
            entity_type=r.entity_type,
            sub_type=r.sub_type,
            page_number=r.page_number,
            bbox=[r.bbox_x0, r.bbox_y0, r.bbox_x1, r.bbox_y1],
            center=[r.center_x, r.center_y],
            raw_text=r.raw_text,
        )
        for r in records
    ]

@router.post("/trace", response_model=TraceEquipmentResponse)
async def trace_equipment(
    request: TraceEquipmentRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DrawingEntity).where(DrawingEntity.drawing_id == request.drawing_id)
    records = (await db.execute(stmt)).scalars().all()

    if not records:
        raise HTTPException(status_code=404, detail=f"No entities found for drawing {request.drawing_id}.")

    entities_list = [
        {
            "tag": r.tag,
            "entity_type": r.entity_type,
            "sub_type": r.sub_type,
            "page_number": r.page_number,
            "bbox": [r.bbox_x0, r.bbox_y0, r.bbox_x1, r.bbox_y1],
            "center": [r.center_x, r.center_y],
            "raw_text": r.raw_text,
        }
        for r in records
    ]

    trace_res = trace_equipment_network(
        entities=entities_list,
        target_tag=request.target_tag,
        radius_px=request.radius_px,
    )

    t_ent = None
    if trace_res["target_entity"]:
        te = trace_res["target_entity"]
        t_ent = DrawingEntityItem(
            tag=te["tag"],
            entity_type=te["entity_type"],
            sub_type=te["sub_type"],
            page_number=te["page_number"],
            bbox=te["bbox"],
            center=te["center"],
            raw_text=te["raw_text"],
        )

    inst_items = [
        DrawingEntityItem(
            tag=i["tag"],
            entity_type=i["entity_type"],
            sub_type=i["sub_type"],
            page_number=i["page_number"],
            bbox=i["bbox"],
            center=i["center"],
            distance_px=i.get("distance_px"),
            raw_text=i["raw_text"],
        )
        for i in trace_res["connected_instruments"]
    ]

    valve_items = [
        DrawingEntityItem(
            tag=v["tag"],
            entity_type=v["entity_type"],
            sub_type=v["sub_type"],
            page_number=v["page_number"],
            bbox=v["bbox"],
            center=v["center"],
            distance_px=v.get("distance_px"),
            raw_text=v["raw_text"],
        )
        for v in trace_res["connected_valves"]
    ]

    line_items = [
        DrawingEntityItem(
            tag=l["tag"],
            entity_type=l["entity_type"],
            sub_type=l["sub_type"],
            page_number=l["page_number"],
            bbox=l["bbox"],
            center=l["center"],
            distance_px=l.get("distance_px"),
            raw_text=l["raw_text"],
        )
        for l in trace_res["connected_lines"]
    ]

    return TraceEquipmentResponse(
        target_tag=request.target_tag,
        target_entity=t_ent,
        connected_instruments=inst_items,
        connected_valves=valve_items,
        connected_lines=line_items,
        total_associated=trace_res["total_associated"],
    )

@router.get("/{drawing_id}/render-annotated")
async def render_drawing_image(
    drawing_id: UUID,
    page_num: int = 1,
    target_tag: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(EngineeringDrawing).where(EngineeringDrawing.id == drawing_id)
    rec = (await db.execute(stmt)).scalar_one_or_none()
    if not rec or not os.path.exists(rec.file_path):
        raise HTTPException(status_code=404, detail="Drawing file not found.")

    with open(rec.file_path, "rb") as f:
        file_bytes = f.read()

    stmt_ent = select(DrawingEntity).where(DrawingEntity.drawing_id == drawing_id)
    ents = (await db.execute(stmt_ent)).scalars().all()
    entity_dicts = [
        {
            "tag": e.tag,
            "entity_type": e.entity_type,
            "page_number": e.page_number,
            "bbox": [e.bbox_x0, e.bbox_y0, e.bbox_x1, e.bbox_y1],
        }
        for e in ents
    ]

    png_bytes = render_annotated_drawing(
        doc_bytes=file_bytes,
        page_num=page_num,
        entities=entity_dicts,
        target_tag=target_tag,
    )

    return Response(content=png_bytes, media_type="image/png")

@router.post("/qa", response_model=DrawingQAResponse)
async def drawing_visual_qa(
    request: DrawingQARequest,
    db: AsyncSession = Depends(get_db),
):
    stmt_d = select(EngineeringDrawing).where(EngineeringDrawing.id == request.drawing_id)
    drawing = (await db.execute(stmt_d)).scalar_one_or_none()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")

    stmt_e = select(DrawingEntity).where(DrawingEntity.drawing_id == request.drawing_id)
    entities = (await db.execute(stmt_e)).scalars().all()

    equip_tags = [e.tag for e in entities if e.entity_type == "EQUIPMENT"]
    valve_tags = [e.tag for e in entities if e.entity_type == "VALVE"]
    inst_tags = [e.tag for e in entities if e.entity_type == "INSTRUMENT"]
    line_tags = [e.tag for e in entities if e.entity_type == "LINE"]

    target_details = ""
    if request.target_tag:
        entities_list = [
            {
                "tag": r.tag,
                "entity_type": r.entity_type,
                "sub_type": r.sub_type,
                "page_number": r.page_number,
                "center": [r.center_x, r.center_y],
            }
            for r in entities
        ]
        trace = trace_equipment_network(entities_list, request.target_tag)
        inst_connected = [f"{i['tag']} ({i.get('distance_px')}px)" for i in trace["connected_instruments"][:5]]
        valves_connected = [f"{v['tag']} ({v.get('distance_px')}px)" for v in trace["connected_valves"][:5]]
        target_details = f"\nSpatial Connectivity for {request.target_tag}:\n- Nearby Valves: {', '.join(valves_connected)}\n- Nearby Instruments: {', '.join(inst_connected)}"

    topology_summary = (
        f"Drawing: {drawing.drawing_number} - {drawing.title} (Unit: {drawing.plant_unit})\n"
        f"Total Entities Detected: {len(entities)}\n"
        f"Major Equipment: {', '.join(equip_tags)}\n"
        f"Safety & Control Valves: {', '.join(valve_tags)}\n"
        f"Instrumentation: {', '.join(inst_tags)}\n"
        f"Piping Lines: {', '.join(line_tags)}\n"
        f"{target_details}"
    )

    system_prompt = (
        "You are an industrial engineer analyzing Piping and Instrumentation Diagrams (P&IDs).\n"
        "Answer the question accurately based solely on the provided schematic topological data.\n"
        "Mention specific equipment tags, safety valves (XV/PSV), and transmitters (PT/TT) where relevant."
    )

    user_query = f"Schematic Data:\n{topology_summary}\n\nQuestion: {request.question}\n\nAnswer:"

    try:
        reply = await llm_service.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query},
            ],
            temperature=0.1,
            max_tokens=250,
            timeout_seconds=90.0,
        )
    except Exception as e:
        reply = f"Error generating drawing analysis: {str(e)}"

    cited = [e.tag for e in entities if e.tag in reply]

    return DrawingQAResponse(
        drawing_id=request.drawing_id,
        question=request.question,
        answer=reply,
        cited_tags=cited,
    )

