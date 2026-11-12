import os
import sys
import asyncio
import hashlib
from typing import Dict, Any, List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.core.config import settings
from server.core.database import AsyncSessionLocal
from server.models.document import Document, DocumentVersion, DocumentChunk, EquipmentTag, ChunkTagMapping
from server.models.drawings import EngineeringDrawing, DrawingEntity
from server.models.calculation import CalculationRun
from server.models.audit import AuditLog
from server.ingestion.pdf_parser import parse_pdf_document
from server.retrieval.vector_store import OllamaEmbeddingService
from server.drawings.pid_parser import parse_drawing_entities
from server.audit.ledger import AuditLedgerService, GENESIS_HASH

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_documents")

DOCUMENTS_METADATA = [
    {
        "filename": "MRPL-SOP-HSE-001.pdf",
        "title": "MRPL Standard Operating Procedure: Refinery HSE & Personnel Protective Equipment Protocols",
        "doc_type": "SOP",
        "plant_unit": "REFINERY-WIDE",
        "department": "HSE",
        "confidentiality_level": "PUBLIC",
        "created_by": "hse_officer",
    },
    {
        "filename": "MRPL-SOP-MEC-201.pdf",
        "title": "MRPL Standard Operating Procedure: Centrifugal Slurry Pump P-201A/B Operation & Maintenance",
        "doc_type": "SOP",
        "plant_unit": "FCCU",
        "department": "MECHANICAL",
        "confidentiality_level": "INTERNAL",
        "created_by": "lead_mechanical_engineer",
    },
    {
        "filename": "MRPL-SOP-OPS-101.pdf",
        "title": "MRPL Standard Operating Procedure: Crude Distillation Unit (CDU-1) Emergency Depressurization Protocol",
        "doc_type": "SOP",
        "plant_unit": "CDU-1",
        "department": "OPERATIONS",
        "confidentiality_level": "RESTRICTED",
        "created_by": "operations_superintendent",
    },
    {
        "filename": "MRPL-SPEC-HCK-901.pdf",
        "title": "MRPL Confidential Engineering Spec: Hydrocracker Unit Second-Stage Catalyst Kinetic Yield Model",
        "doc_type": "TECHNICAL_SPEC",
        "plant_unit": "HCU",
        "department": "PROCESS_ENGINEERING",
        "confidentiality_level": "SECRET",
        "created_by": "chief_process_specialist",
    },
]

EQUIPMENT_DATA = [
    {
        "tag_number": "T-101",
        "equipment_name": "Crude Atmospheric Fractionator Column",
        "equipment_type": "COLUMN",
        "plant_unit": "CDU-1",
        "design_specs": {
            "trays": 42,
            "height_m": 48.5,
            "diameter_m": 3.8,
            "design_pressure_bar": 3.5,
            "feed_stream": "8\"-P-101-CS-150",
        },
    },
    {
        "tag_number": "E-101",
        "equipment_name": "Crude Feed Pre-Heat Exchanger",
        "equipment_type": "HEAT_EXCHANGER",
        "plant_unit": "CDU-1",
        "design_specs": {
            "type": "Shell & Tube",
            "heat_transfer_area_m2": 320.0,
            "duty_mw": 8.5,
            "design_lmtd_c": 82.26,
            "shell_fluid": "Atmospheric Residue",
            "tube_fluid": "Desalted Crude",
        },
    },
    {
        "tag_number": "P-101A",
        "equipment_name": "Crude Bottoms Residue Pump A",
        "equipment_type": "PUMP",
        "plant_unit": "CDU-1",
        "design_specs": {
            "rated_flow_m3_hr": 280.0,
            "head_m": 55.0,
            "motor_power_kw": 75.0,
            "suction_line": "6\"-P-102-CS-150",
        },
    },
    {
        "tag_number": "P-101B",
        "equipment_name": "Crude Bottoms Residue Pump B (Standby)",
        "equipment_type": "PUMP",
        "plant_unit": "CDU-1",
        "design_specs": {
            "rated_flow_m3_hr": 280.0,
            "head_m": 55.0,
            "motor_power_kw": 75.0,
            "suction_line": "6\"-P-102-CS-150",
        },
    },
    {
        "tag_number": "V-101",
        "equipment_name": "CDU Overhead Reflux Accumulator Drum",
        "equipment_type": "VESSEL",
        "plant_unit": "CDU-1",
        "design_specs": {
            "volume_m3": 45.0,
            "design_pressure_bar": 3.0,
            "inlet_line": "4\"-P-103-CS-300",
            "reflux_draw_line": "2\"-P-104-CS-150",
        },
    },
    {
        "tag_number": "P-201A",
        "equipment_name": "FCCU Slurry Circulation Pump A",
        "equipment_type": "PUMP",
        "plant_unit": "FCCU",
        "design_specs": {
            "rated_flow_m3_hr": 250.0,
            "head_m": 45.0,
            "motor_power_kw": 55.0,
            "slurry_density_kg_m3": 1050.0,
            "discharge_line": "6\"-P-204-CS-150",
            "seal_flush_plan": "API Plan 53B",
        },
    },
    {
        "tag_number": "P-201B",
        "equipment_name": "FCCU Slurry Circulation Pump B (Standby)",
        "equipment_type": "PUMP",
        "plant_unit": "FCCU",
        "design_specs": {
            "rated_flow_m3_hr": 250.0,
            "head_m": 45.0,
            "motor_power_kw": 55.0,
            "slurry_density_kg_m3": 1050.0,
            "discharge_line": "6\"-P-204-CS-150",
            "seal_flush_plan": "API Plan 53B",
        },
    },
    {
        "tag_number": "R-901",
        "equipment_name": "Hydrocracker Second-Stage Catalytic Reactor",
        "equipment_type": "REACTOR",
        "plant_unit": "HCU",
        "design_specs": {
            "catalyst_type": "Sulfided Ni-Mo on dealuminated Y-Zeolite",
            "activation_energy_kj_mol": 142.5,
            "operating_h2_partial_pressure_bar": 145.0,
            "max_bed_delta_t_c": 18.0,
            "target_ulsd_yield_wt_pct": 61.2,
        },
    },
]

CALCULATION_RUNS_DATA = [
    {
        "formula_name": "HEAT_EXCHANGER_LMTD",
        "python_code": (
            "import math\n"
            "t_hot_in, t_hot_out = 160.0, 120.0\n"
            "t_cold_in, t_cold_out = 30.0, 85.0\n"
            "d1 = t_hot_in - t_cold_out\n"
            "d2 = t_hot_out - t_cold_in\n"
            "lmtd = (d2 - d1) / math.log(d2 / d1)\n"
            "result = {'lmtd_celsius': round(lmtd, 2), 'delta_t1': d1, 'delta_t2': d2}\n"
        ),
        "input_params": {
            "equipment_tag": "E-101",
            "t_hot_in": 160.0,
            "t_hot_out": 120.0,
            "t_cold_in": 30.0,
            "t_cold_out": 85.0,
        },
        "calculated_output": {
            "lmtd_celsius": 82.26,
            "delta_t1": 75.0,
            "delta_t2": 90.0,
        },
        "claimed_value": 82.0,
        "discrepancy_pct": 0.31,
        "verification_passed": True,
        "execution_time_ms": 14,
        "sandbox_status": "COMPLETED",
    },
    {
        "formula_name": "PUMP_POWER_RATING",
        "python_code": (
            "flow = 250.0 / 3600.0\n"
            "head, rho, g, eff = 45.0, 1050.0, 9.81, 0.72\n"
            "hyd_power = (flow * rho * g * head) / 1000.0\n"
            "bhp = hyd_power / eff\n"
            "motor = 55.0\n"
            "result = {'hydraulic_power_kw': round(hyd_power, 2), 'bhp_kw': round(bhp, 2), 'motor_kw': motor}\n"
        ),
        "input_params": {
            "equipment_tag": "P-201A",
            "flow_rate_m3_hr": 250.0,
            "head_m": 45.0,
            "density_kg_m3": 1050.0,
            "efficiency": 0.72,
        },
        "calculated_output": {
            "hydraulic_power_kw": 32.18,
            "bhp_kw": 44.69,
            "motor_kw": 55.0,
        },
        "claimed_value": 45.0,
        "discrepancy_pct": 0.69,
        "verification_passed": True,
        "execution_time_ms": 11,
        "sandbox_status": "COMPLETED",
    },
    {
        "formula_name": "DARCY_WEISBACH_HEAD_LOSS",
        "python_code": (
            "f, l, d, v, g = 0.018, 85.0, 0.15, 2.2, 9.81\n"
            "hf = f * (l / d) * (v ** 2) / (2.0 * g)\n"
            "dp = hf * 1050.0 * g / 1000.0\n"
            "result = {'head_loss_m': round(hf, 2), 'pressure_drop_kpa': round(dp, 2)}\n"
        ),
        "input_params": {
            "line_tag": "6\"-P-204-CS-150",
            "pipe_diameter_m": 0.15,
            "length_m": 85.0,
            "flow_velocity_m_s": 2.2,
            "friction_factor": 0.018,
            "density_kg_m3": 1050.0,
        },
        "calculated_output": {
            "head_loss_m": 2.51,
            "pressure_drop_kpa": 25.83,
        },
        "claimed_value": 2.50,
        "discrepancy_pct": 0.40,
        "verification_passed": True,
        "execution_time_ms": 12,
        "sandbox_status": "COMPLETED",
    },
]

async def seed_documents(session: AsyncSession, embedding_svc: OllamaEmbeddingService) -> Dict[str, Document]:
    created_docs = {}
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    for item in DOCUMENTS_METADATA:
        pdf_path = os.path.join(DATA_DIR, item["filename"])
        if not os.path.exists(pdf_path):
            continue

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        file_hash, extracted_chunks, doc_meta = parse_pdf_document(
            file_bytes=pdf_bytes,
            document_title=item["title"],
        )

        dest_path = os.path.join(settings.UPLOAD_DIR, f"{file_hash}_{item['filename']}")
        with open(dest_path, "wb") as f:
            f.write(pdf_bytes)

        existing_stmt = select(DocumentVersion).where(DocumentVersion.file_hash_sha256 == file_hash)
        existing = (await session.execute(existing_stmt)).scalar_one_or_none()

        if existing:
            doc_stmt = select(Document).where(Document.id == existing.document_id)
            doc_rec = (await session.execute(doc_stmt)).scalar_one()
            created_docs[item["filename"]] = doc_rec
            continue

        doc_rec = Document(
            title=item["title"],
            doc_type=item["doc_type"],
            plant_unit=item["plant_unit"],
            department=item["department"],
            confidentiality_level=item["confidentiality_level"],
            created_by=item["created_by"],
        )
        session.add(doc_rec)
        await session.flush()

        ver_rec = DocumentVersion(
            document_id=doc_rec.id,
            version_number=1,
            file_name=item["filename"],
            file_path=dest_path,
            file_size_bytes=len(pdf_bytes),
            file_hash_sha256=file_hash,
            mime_type="application/pdf",
            status="INDEXED",
            metadata_=doc_meta,
        )
        session.add(ver_rec)
        await session.flush()

        if extracted_chunks:
            texts = [c["content"] for c in extracted_chunks]
            embeddings = await embedding_svc.generate_embeddings_batch(texts)

            for idx, chunk in enumerate(extracted_chunks):
                c_rec = DocumentChunk(
                    version_id=ver_rec.id,
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"],
                    embedding=embeddings[idx] if idx < len(embeddings) else None,
                    page_number=chunk["page_number"],
                    token_count=chunk["token_count"],
                    metadata_=chunk["metadata"],
                )
                session.add(c_rec)

        await session.commit()
        created_docs[item["filename"]] = doc_rec
        print(f"Indexed document: {item['filename']} with {len(extracted_chunks)} chunks (Level: {item['confidentiality_level']})")

    return created_docs

async def seed_equipment_tags(session: AsyncSession) -> Dict[str, EquipmentTag]:
    tags_map = {}
    for eq in EQUIPMENT_DATA:
        stmt = select(EquipmentTag).where(EquipmentTag.tag_number == eq["tag_number"])
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            tags_map[eq["tag_number"]] = existing
            continue

        tag_rec = EquipmentTag(
            tag_number=eq["tag_number"],
            equipment_name=eq["equipment_name"],
            equipment_type=eq["equipment_type"],
            plant_unit=eq["plant_unit"],
            design_specs=eq["design_specs"],
        )
        session.add(tag_rec)
        await session.flush()
        tags_map[eq["tag_number"]] = tag_rec

    await session.commit()
    print(f"Seeded {len(tags_map)} equipment tags")
    return tags_map

async def seed_drawing(session: AsyncSession) -> EngineeringDrawing:
    dwg_file = "MRPL-PID-CDU-101.pdf"
    dwg_path = os.path.join(DATA_DIR, dwg_file)
    with open(dwg_path, "rb") as f:
        file_bytes = f.read()

    file_hash = hashlib.sha256(file_bytes).hexdigest()
    dest_path = os.path.join(settings.UPLOAD_DIR, f"drawing_{file_hash}_{dwg_file}")
    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    existing_stmt = select(EngineeringDrawing).where(EngineeringDrawing.drawing_number == "MRPL-PID-CDU-101")
    existing_dwg = (await session.execute(existing_stmt)).scalar_one_or_none()

    if existing_dwg:
        print(f"Drawing MRPL-PID-CDU-101 already seeded (ID: {existing_dwg.id})")
        return existing_dwg

    parsed = parse_drawing_entities(file_bytes)

    dwg_rec = EngineeringDrawing(
        drawing_number="MRPL-PID-CDU-101",
        title="CDU-1 Atmospheric Fractionation & Pre-Heat Train P&ID",
        plant_unit="CDU-1",
        revision="3",
        total_pages=1,
        file_path=dest_path,
    )
    session.add(dwg_rec)
    await session.flush()

    for item in parsed["entities"]:
        bbox = item.get("bbox", [0, 0, 0, 0])
        center = item.get("center", [0, 0])
        ent = DrawingEntity(
            drawing_id=dwg_rec.id,
            tag=item["tag"],
            entity_type=item["entity_type"],
            sub_type=item.get("sub_type"),
            page_number=item.get("page_number", 1),
            bbox_x0=float(bbox[0]),
            bbox_y0=float(bbox[1]),
            bbox_x1=float(bbox[2]),
            bbox_y1=float(bbox[3]),
            center_x=float(center[0]),
            center_y=float(center[1]),
            associated_equipment=item.get("associated_equipment"),
            raw_text=item.get("raw_text", item["tag"]),
        )
        session.add(ent)

    await session.commit()
    print(f"Seeded P&ID drawing MRPL-PID-CDU-101 with {parsed['total_entities']} detected ISA entities")
    return dwg_rec

async def seed_calculations(session: AsyncSession):
    for calc in CALCULATION_RUNS_DATA:
        stmt = (
            select(CalculationRun)
            .where(CalculationRun.formula_name == calc["formula_name"])
            .limit(1)
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            continue

        c_rec = CalculationRun(
            formula_name=calc["formula_name"],
            python_code=calc["python_code"],
            input_params=calc["input_params"],
            calculated_output=calc["calculated_output"],
            claimed_value=calc["claimed_value"],
            discrepancy_pct=calc["discrepancy_pct"],
            verification_passed=calc["verification_passed"],
            execution_time_ms=calc["execution_time_ms"],
            sandbox_status=calc["sandbox_status"],
        )
        session.add(c_rec)

    await session.commit()
    print("Seeded deterministic engineering calculation runs")

async def seed_audit_ledger(session: AsyncSession):
    ledger_svc = AuditLedgerService()
    
    count_stmt = select(AuditLog)
    existing_count = len((await session.execute(count_stmt)).all())
    if existing_count > 0:
        print(f"Audit ledger already contains {existing_count} records. Verifying integrity...")
        integrity = await ledger_svc.verify_chain_integrity(session)
        print(f"Chain status: {'VALID' if integrity['integrity_valid'] else 'BROKEN'} ({integrity['message']})")
        return

    events = [
        {
            "user_id": "system_daemon",
            "user_role": "ADMIN",
            "event_type": "SYSTEM_INITIALIZATION",
            "resource_id": "SYS-CORE",
            "details": {
                "system_mode": "AIR_GAPPED_SOVEREIGN",
                "network_egress_allowed": False,
                "vector_dimension": 768,
                "llm_engine": "llama3.2:1b",
            },
        },
        {
            "user_id": "hse_officer",
            "user_role": "OPERATOR",
            "event_type": "DOCUMENT_INGESTION",
            "resource_id": "MRPL-SOP-HSE-001",
            "details": {
                "doc_title": "Refinery HSE & Personnel Protective Equipment Protocols",
                "clearance": "PUBLIC",
                "chunks_count": 4,
            },
        },
        {
            "user_id": "lead_mechanical_engineer",
            "user_role": "PROCESS_ENGINEER",
            "event_type": "DOCUMENT_INGESTION",
            "resource_id": "MRPL-SOP-MEC-201",
            "details": {
                "doc_title": "Centrifugal Slurry Pump P-201A/B Operation & Maintenance",
                "clearance": "INTERNAL",
                "chunks_count": 5,
            },
        },
        {
            "user_id": "operations_superintendent",
            "user_role": "PLANT_MANAGER",
            "event_type": "DOCUMENT_INGESTION",
            "resource_id": "MRPL-SOP-OPS-101",
            "details": {
                "doc_title": "CDU-1 Emergency Depressurization Protocol",
                "clearance": "RESTRICTED",
                "chunks_count": 5,
            },
        },
        {
            "user_id": "chief_process_specialist",
            "user_role": "SAFETY_AUDITOR",
            "event_type": "DOCUMENT_INGESTION",
            "resource_id": "MRPL-SPEC-HCK-901",
            "details": {
                "doc_title": "Hydrocracker Second-Stage Catalyst Kinetic Yield Model",
                "clearance": "SECRET",
                "chunks_count": 4,
            },
        },
        {
            "user_id": "lead_piping_engineer",
            "user_role": "PROCESS_ENGINEER",
            "event_type": "SCHEMATIC_REGISTERED",
            "resource_id": "MRPL-PID-CDU-101",
            "details": {
                "drawing_title": "CDU-1 Atmospheric Fractionation & Pre-Heat Train P&ID",
                "revision": "3",
                "isa_entities_detected": 22,
            },
        },
        {
            "user_id": "lead_mechanical_engineer",
            "user_role": "PROCESS_ENGINEER",
            "event_type": "CALCULATION_VERIFIED",
            "resource_id": "CALC-LMTD-E101",
            "details": {
                "formula": "HEAT_EXCHANGER_LMTD",
                "equipment": "E-101",
                "discrepancy_pct": 0.31,
                "status": "PASSED",
            },
        },
        {
            "user_id": "lead_mechanical_engineer",
            "user_role": "PROCESS_ENGINEER",
            "event_type": "CALCULATION_VERIFIED",
            "resource_id": "CALC-PUMP-P201A",
            "details": {
                "formula": "PUMP_POWER_RATING",
                "equipment": "P-201A",
                "discrepancy_pct": 0.69,
                "status": "PASSED",
            },
        },
        {
            "user_id": "chief_compliance_officer",
            "user_role": "SAFETY_AUDITOR",
            "event_type": "CLEARANCE_SECURITY_CHECK",
            "resource_id": "SEC-AUDIT-001",
            "details": {
                "enforced_roles": ["OPERATOR", "PROCESS_ENGINEER", "PLANT_MANAGER", "SAFETY_AUDITOR"],
                "row_level_security_active": True,
                "cryptographic_verification": "UNBROKEN",
            },
        },
    ]

    for ev in events:
        await ledger_svc.record_event(
            session=session,
            user_id=ev["user_id"],
            user_role=ev["user_role"],
            event_type=ev["event_type"],
            resource_id=ev["resource_id"],
            details=ev["details"],
        )

    integrity = await ledger_svc.verify_chain_integrity(session)
    print(f"Created {len(events)} cryptographic audit records. Verification: {integrity['message']}")

async def main():
    embedding_svc = OllamaEmbeddingService()
    async with AsyncSessionLocal() as session:
        print("--- Starting Sovereign MRPL Knowledge Workbench Seeding ---")
        await seed_documents(session, embedding_svc)
        await seed_equipment_tags(session)
        await seed_drawing(session)
        await seed_calculations(session)
        await seed_audit_ledger(session)
        print("--- Seeding Completed Successfully ---")

if __name__ == "__main__":
    asyncio.run(main())
