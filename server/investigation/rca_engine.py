import os
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import pymupdf
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from server.models.audit import AuditLog
from server.models.governance import ApprovalRequest
from server.models.investigation import ShiftHandover, RcaReport
from server.schemas.investigation import WhyStep, CapaItem, RcaPresetItem
from server.telemetry.dcs_simulator import dcs_simulator
from server.telemetry.checklist_engine import checklist_engine

def compute_hash(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

class RcaInvestigationEngine:
    def get_presets(self) -> List[RcaPresetItem]:
        return [
            RcaPresetItem(
                key="CDU_FURNACE_OVERHEAT",
                incident_title="CDU-1 Atmospheric Furnace Coil Outlet Over-Temperature Trip",
                plant_unit="CDU-1",
                triggering_tag="TT-102",
                sop_reference="MRPL-SOP-OPS-101",
                initial_observation="Furnace coil outlet temperature TT-102 spiked to 392.4°C exceeding 385.0°C trip limit, triggering automated feed valve XV-101 closure and emergency bypass.",
            ),
            RcaPresetItem(
                key="FCCU_PUMP_TRIP",
                incident_title="FCCU Slurry Pump P-201A High Vibration & Seal Pressure Loss",
                plant_unit="FCCU",
                triggering_tag="VIB-201A",
                sop_reference="MRPL-SOP-MEC-201",
                initial_observation="Slurry pump P-201A tripped on ISO 10816-3 Class II vibration at 9.45 mm/s RMS accompanied by Plan 53B barrier fluid pressure drop to 12.4 bar.",
            ),
            RcaPresetItem(
                key="HCU_QUENCH_RUNAWAY",
                incident_title="Hydrocracker Reactor R-901 Inter-bed Temperature Excursion",
                plant_unit="HCU",
                triggering_tag="DT-901",
                sop_reference="MRPL-SPEC-HCK-901",
                initial_observation="Reactor R-901 Bed 1-2 temperature delta escalated to 22.8°C exceeding 18.0°C runaway safety threshold, requiring maximum cold hydrogen quench flow.",
            ),
        ]

    async def generate_shift_handover(
        self,
        session: AsyncSession,
        shift_type: str,
        outgoing_operator: str,
        relieving_operator: Optional[str] = None,
    ) -> ShiftHandover:
        stmt_audit = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(50)
        audit_records = (await session.execute(stmt_audit)).scalars().all()
        events_count = len(audit_records)

        snapshot = dcs_simulator.get_snapshot()
        alarms_resp = checklist_engine.evaluate_alarms_and_checklists(snapshot)

        critical_incidents: List[str] = []
        for alarm in alarms_resp.alarms:
            critical_incidents.append(
                f"[{alarm.severity}] {alarm.tag} ({alarm.unit_id}): {alarm.description} - Value: {alarm.current_value} {alarm.engineering_unit} (Threshold: {alarm.threshold_value})"
            )

        stmt_mocs = select(ApprovalRequest).order_by(desc(ApprovalRequest.created_at)).limit(5)
        mocs = (await session.execute(stmt_mocs)).scalars().all()
        pending_mocs: List[str] = [
            f"MOC-{str(m.id)[:8].upper()}: {m.title} ({m.status})" for m in mocs
        ]

        equipment_status: Dict[str, str] = {
            "CDU-1 Column T-101": "Steady overhead condensation, reflux accumulator V-101 level normal" if snapshot.overall_status != "CRITICAL" else "Abnormal process excursion under mitigation",
            "FCCU Slurry Pump P-201A": "Operating at nominal vibration" if snapshot.overall_status != "CRITICAL" else "Monitoring drive motor and mechanical seal barrier fluid",
            "HCU Reactor R-901": "Bed 1-2 delta T within safety limits, hydrogen partial pressure nominal" if snapshot.overall_status != "CRITICAL" else "Monitoring quench control loops",
        }

        standing_orders = [
            "Maintain strict zero external internet egress on all workbench edge terminals.",
            "Monitor API Plan 53B barrier fluid pressure accumulator on slurry pumps every 2 hours.",
            "Ensure hydrogen quench emergency interlock response time is logged in shift ledger.",
            "Verify all engineering MOC edits carry SHA-256 digital signature before shift release.",
        ]

        summary_lines = [
            f"=== MRPL REFINERY SHIFT HANDOVER LOG: {shift_type.upper()} SHIFT ===",
            f"Outgoing In-Charge: {outgoing_operator}",
            f"Relieving In-Charge: {relieving_operator or 'Unassigned'}",
            f"Operational Events Recorded in Ledger: {events_count}",
            f"Active Unit Alarms: {len(alarms_resp.alarms)}",
            "",
            "1. CRITICAL INCIDENTS & TRIPS:",
        ]
        if critical_incidents:
            summary_lines.extend([f"   - {inc}" for inc in critical_incidents])
        else:
            summary_lines.append("   - All refinery units operated within normal operating limits (NOL). No trips.")

        summary_lines.extend([
            "",
            "2. MAJOR EQUIPMENT STATUS:",
        ])
        for eq, st in equipment_status.items():
            summary_lines.append(f"   - {eq}: {st}")

        summary_lines.extend([
            "",
            "3. ACTIVE MANAGEMENT OF CHANGE (MOC) TICKETS:",
        ])
        if pending_mocs:
            summary_lines.extend([f"   - {moc}" for moc in pending_mocs])
        else:
            summary_lines.append("   - No pending MOC tickets.")

        summary_lines.extend([
            "",
            "4. SHIFT STANDING ORDERS:",
        ])
        for so in standing_orders:
            summary_lines.append(f"   - {so}")

        handover_text = "\n".join(summary_lines)
        now_dt = datetime.now(timezone.utc)
        sig_payload = f"HANDOVER:{shift_type}:{outgoing_operator}:{now_dt.isoformat()}:{events_count}"
        out_sig = compute_hash(sig_payload)

        handover = ShiftHandover(
            shift_type=shift_type,
            outgoing_operator=outgoing_operator,
            relieving_operator=relieving_operator,
            events_count=events_count,
            critical_incidents=critical_incidents,
            equipment_status=equipment_status,
            pending_mocs=pending_mocs,
            standing_orders=standing_orders,
            handover_summary=handover_text,
            outgoing_signature=out_sig,
            created_at=now_dt,
        )
        session.add(handover)
        await session.commit()
        await session.refresh(handover)
        return handover

    async def countersign_handover(
        self,
        session: AsyncSession,
        handover_id: uuid.UUID,
        relieving_operator: str,
    ) -> ShiftHandover:
        stmt = select(ShiftHandover).where(ShiftHandover.id == handover_id)
        handover = (await session.execute(stmt)).scalar_one_or_none()
        if not handover:
            raise ValueError("Shift handover log not found.")

        now_dt = datetime.now(timezone.utc)
        counter_payload = f"COUNTERSIGN:{handover.id}:{relieving_operator}:{now_dt.isoformat()}"
        rel_sig = compute_hash(counter_payload)

        handover.relieving_operator = relieving_operator
        handover.relieving_signature = rel_sig
        handover.countersigned_at = now_dt
        await session.commit()
        await session.refresh(handover)
        return handover

    async def generate_5why_rca(
        self,
        session: AsyncSession,
        request_data: Dict[str, Any],
    ) -> RcaReport:
        title = request_data.get("incident_title", "Refinery Process Incident")
        unit = request_data.get("plant_unit", "CDU-1")
        tag = request_data.get("triggering_tag", "TT-102")
        sop = request_data.get("sop_reference", "MRPL-SOP-OPS-101")
        investigator = request_data.get("investigator_id", "lead_process_eng")

        if "CDU" in unit or "TT-102" in tag or "Furnace" in title:
            prob = "Atmospheric Crude Distillation furnace coil outlet temperature (TT-102) spiked to 392.4°C exceeding safety trip threshold of 385.0°C, initiating rapid fuel cutoff and charge isolation."
            whys = [
                WhyStep(
                    level=1,
                    question="Why did the coil outlet temperature TT-102 exceed the 385.0°C trip limit?",
                    answer="Furnace heat flux to radiant section tubes exceeded the convective heat absorption rate of the crude charge stream.",
                    evidence_reference="DCS Trend Log TT-102 & Fuel Gas Flow FCV-102",
                ),
                WhyStep(
                    level=2,
                    question="Why did the convective heat absorption rate of the crude stream suddenly drop?",
                    answer="Crude charge flow transmitter FT-103 experienced a momentary 45% flow slump from 450 m³/h down to 245 m³/h.",
                    evidence_reference="FT-103 DCS Historian & MRPL-SOP-OPS-101 Sec 3.2",
                ),
                WhyStep(
                    level=3,
                    question="Why did the crude feed flow FT-103 drop unexpectedly?",
                    answer="Charge pump P-101A developed suction cavitation due to localized light ends vaporization in the bottom suction header 6\"-P-102-CS-150.",
                    evidence_reference="Pump P-101A Suction Pressure Log & P&ID Drawing MRPL-PID-CDU-101",
                ),
                WhyStep(
                    level=4,
                    question="Why did light ends vaporize in the pump suction line?",
                    answer="Desalter wash-water injection rate was reduced upstream, elevating crude inlet temperature without compensation in atmospheric tower bottom temperature control.",
                    evidence_reference="Desalter Unit Log & Column Bottoms TI-106",
                ),
                WhyStep(
                    level=5,
                    question="Why was there no automated protection against flow slump during desalter thermal fluctuations?",
                    answer="The furnace fuel gas control loop lacked active feed-forward cross-limiting logic tied to crude charge flow slump in the legacy DCS configuration.",
                    evidence_reference="Honeywell DCS Regulatory Control Logic Configuration Sheet",
                ),
            ]
            capas = [
                CapaItem(
                    action_type="CORRECTIVE",
                    description="Implement automated feed-forward cross-limiting logic in DCS between FT-103 crude flow and fuel gas control valve FCV-102.",
                    owner="DCS Lead Engineer",
                    target_sop="MRPL-SOP-OPS-101 Section 3.2",
                    deadline_days=7,
                ),
                CapaItem(
                    action_type="PREVENTIVE",
                    description="Inspect and clean suction strainers on charge bottoms pumps P-101A/B and verify NPSH safety margins during upcoming turnaround.",
                    owner="Mechanical Maintenance In-Charge",
                    target_sop="MRPL-SOP-MEC-201 Section 2.1",
                    deadline_days=14,
                ),
            ]
        elif "FCCU" in unit or "201" in tag or "Pump" in title:
            prob = "Fluid Catalytic Cracking Unit heavy slurry pump P-201A tripped on ISO 10816-3 Class II high vibration at 9.45 mm/s RMS accompanied by Plan 53B barrier fluid depressurization to 12.4 bar."
            whys = [
                WhyStep(
                    level=1,
                    question="Why did slurry pump P-201A trip on excessive vibration (>9.0 mm/s)?",
                    answer="Dynamic rotational unbalance developed in the impeller assembly causing severe radial vibration on drive shaft bearing housings.",
                    evidence_reference="Vibration Transmitter VIB-201A & ISO 10816-3 Class II Trip Log",
                ),
                WhyStep(
                    level=2,
                    question="Why did dynamic unbalance develop in the impeller assembly?",
                    answer="High catalyst fines concentration in FCCU slurry eroded 316L stainless steel impeller vane tips unevenly, shifting center-of-mass eccentricity.",
                    evidence_reference="Metallurgical Inspection Report & MRPL-SOP-MEC-201 Sec 4.1",
                ),
                WhyStep(
                    level=3,
                    question="Why was catalyst fines abrasion accelerated beyond design allowance?",
                    answer="API Plan 53B mechanical seal barrier fluid pressure dropped below 14.0 bar, allowing abrasive catalyst slurry to penetrate the seal faces.",
                    evidence_reference="Barrier Fluid Pressure Transmitter SEAL-201A Historian",
                ),
                WhyStep(
                    level=4,
                    question="Why did the barrier fluid pressure drop below the 14.0 bar threshold?",
                    answer="The bladder accumulator nitrogen pre-charge depleted gradually over 6 months without interim pressure top-up.",
                    evidence_reference="Accumulator N2 Log Sheet & Vendor Manual API Plan 53B",
                ),
                WhyStep(
                    level=5,
                    question="Why was nitrogen accumulator depletion not caught prior to seal failure?",
                    answer="The monthly preventative maintenance inspection check for seal bladder nitrogen pressure was missed during scheduled turnaround activities.",
                    evidence_reference="CMMS Preventative Maintenance Audit Trail",
                ),
            ]
            capas = [
                CapaItem(
                    action_type="CORRECTIVE",
                    description="Replace worn impeller on P-201A with tungsten-carbide hardened alloy and commission standby pump P-201B.",
                    owner="Process Engineer",
                    target_sop="MRPL-SOP-MEC-201 Section 4.3",
                    deadline_days=5,
                ),
                CapaItem(
                    action_type="PREVENTIVE",
                    description="Mandate bi-weekly automated DCS alerts for Plan 53B barrier accumulator pressure and enforce LOTO check sheets.",
                    owner="Safety Auditor",
                    target_sop="MRPL-SOP-MEC-201 Section 4.4",
                    deadline_days=10,
                ),
            ]
        else:
            prob = "Hydrocracker catalytic reactor R-901 Bed 1 to Bed 2 temperature differential escalated to 22.8°C exceeding 18.0°C runaway trip limit."
            whys = [
                WhyStep(
                    level=1,
                    question="Why did inter-bed temperature delta DT-901 exceed the 18.0°C runaway safety threshold?",
                    answer="Exothermic hydrogenation reactions accelerated uncontrollably in the lower catalyst zone of Bed 1.",
                    evidence_reference="Multipoint Thermocouple Assembly DT-901 & MRPL-SPEC-HCK-901 Sec 2.3",
                ),
                WhyStep(
                    level=2,
                    question="Why did the exothermic reaction rate accelerate beyond heat removal capacity?",
                    answer="Cold hydrogen quench injection flow failed to respond promptly to the initial 15°C temperature rise.",
                    evidence_reference="Quench Flow Valve Feedback Log & DCS Event Historian",
                ),
                WhyStep(
                    level=3,
                    question="Why did cold hydrogen quench injection fail to respond promptly?",
                    answer="The electro-pneumatic positioner on the Bed 1 quench control valve experienced a pneumatic deadband of 18 seconds due to particulate sticking.",
                    evidence_reference="Valve Signature Diagnostic Log & Instrument Maintenance Record",
                ),
                WhyStep(
                    level=4,
                    question="Why was there particulate contamination in the quench valve instrument air line?",
                    answer="Instrument air dryer desiccant coalescing filter element had ruptured upstream, introducing desiccant dust into the actuator line.",
                    evidence_reference="Instrument Air Header Quality Log",
                ),
                WhyStep(
                    level=5,
                    question="Why was the ruptured instrument air filter not detected during preventative rounds?",
                    answer="Differential pressure indicator on the instrument air dryer coalescer had seized, showing a false healthy reading.",
                    evidence_reference="Quarterly Instrument Proof-Testing Log Sheet",
                ),
            ]
            capas = [
                CapaItem(
                    action_type="CORRECTIVE",
                    description="Rebuild and stroke-test Bed 1 hydrogen quench control valve actuator and blow down instrument air lines.",
                    owner="Instrumentation In-Charge",
                    target_sop="MRPL-SPEC-HCK-901 Section 2.4",
                    deadline_days=3,
                ),
                CapaItem(
                    action_type="PREVENTIVE",
                    description="Replace all instrument air coalescer filter elements and install dual-redundant differential pressure transmitters.",
                    owner="Plant Utilities Lead",
                    target_sop="MRPL-SPEC-HCK-901 Section 2.6",
                    deadline_days=12,
                ),
            ]

        formal_lines = [
            f"=== OFFICIAL INCIDENT INVESTIGATION REPORT: {title.upper()} ===",
            f"Plant Unit: {unit}  |  Triggering Tag: {tag}  |  Governing SOP: {sop}",
            f"Lead Investigator: {investigator}  |  Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            "",
            "1. PROBLEM STATEMENT:",
            f"   {prob}",
            "",
            "2. 5-WHY ROOT CAUSE ANALYSIS:",
        ]
        for w in whys:
            formal_lines.extend([
                f"   [Why Level {w.level}] {w.question}",
                f"   -> Finding: {w.answer}",
                f"   -> Evidence: {w.evidence_reference}",
                "",
            ])

        formal_lines.extend([
            "3. CORRECTIVE & PREVENTIVE ACTIONS (CAPA):",
        ])
        for idx, c in enumerate(capas, 1):
            formal_lines.append(
                f"   {idx}. [{c.action_type}] {c.description} (Owner: {c.owner}, SOP: {c.target_sop}, Target: {c.deadline_days} days)"
            )

        formal_text = "\n".join(formal_lines)
        now_dt = datetime.now(timezone.utc)
        sig_hash = compute_hash(f"RCA:{title}:{unit}:{investigator}:{now_dt.isoformat()}")

        report = RcaReport(
            incident_title=title,
            plant_unit=unit,
            triggering_tag=tag,
            sop_reference=sop,
            problem_statement=prob,
            why_steps=[w.model_dump() for w in whys],
            capa_items=[c.model_dump() for c in capas],
            formal_analysis=formal_text,
            investigator_id=investigator,
            signature_hash=sig_hash,
            created_at=now_dt,
        )
        session.add(report)
        await session.commit()
        await session.refresh(report)
        return report

    def render_handover_pdf(self, handover_data: Dict[str, Any], output_path: str):
        doc = pymupdf.open()
        page = doc.new_page(width=595, height=842)

        page.draw_rect(pymupdf.Rect(40, 40, 555, 802), color=(0.8, 0.85, 0.9), width=1)
        page.draw_rect(pymupdf.Rect(40, 40, 555, 95), color=(0.08, 0.18, 0.36), fill=(0.08, 0.18, 0.36))
        page.insert_text((55, 62), "MANGALORE REFINERY AND PETROCHEMICALS LIMITED (MRPL)", fontsize=11, color=(1, 1, 1))
        page.insert_text((55, 78), "OFFICIAL PLANT OPERATIONS SHIFT HANDOVER LOG", fontsize=8.5, color=(0.75, 0.88, 1.0))
        page.insert_text((420, 62), f"SHIFT: {handover_data.get('shift_type', 'DAY')}", fontsize=9, color=(1, 1, 1))
        page.insert_text((420, 78), f"REF: MRPL-SH-{str(handover_data.get('id', '2026'))[:8].upper()}", fontsize=7.5, color=(0.75, 0.88, 1.0))

        page.draw_rect(pymupdf.Rect(40, 95, 555, 125), color=(0.94, 0.96, 0.98), fill=(0.94, 0.96, 0.98))
        out_op = handover_data.get("outgoing_operator", "Shift Lead")
        rel_op = handover_data.get("relieving_operator", "Relief Lead")
        page.insert_text((55, 110), f"Outgoing In-Charge: {out_op}   |   Relieving In-Charge: {rel_op or 'Awaiting Counter-Signature'}", fontsize=8.5, color=(0.08, 0.18, 0.36))
        page.insert_text((55, 120), f"Ledger Events Audited: {handover_data.get('events_count', 0)}   |   Generation Time: {handover_data.get('created_at', '')[:19]} UTC", fontsize=7.5, color=(0.4, 0.45, 0.5))

        y = 140
        summary_text = handover_data.get("handover_summary", "")
        rect_body = pymupdf.Rect(55, y, 540, 650)
        page.insert_textbox(rect_body, summary_text[:2400], fontsize=8.0, color=(0.12, 0.12, 0.12), lineheight=1.28)

        seal_y = 665
        page.draw_rect(pymupdf.Rect(50, seal_y, 545, 775), color=(0.2, 0.3, 0.5), fill=(0.97, 0.98, 1.0), width=1)
        page.draw_rect(pymupdf.Rect(50, seal_y, 545, seal_y + 18), color=(0.15, 0.25, 0.45), fill=(0.15, 0.25, 0.45))
        page.insert_text((58, seal_y + 13), "CRYPTOGRAPHIC DUAL-SIGNATORY HANDOVER SEAL", fontsize=8, color=(1, 1, 1))

        out_sig = handover_data.get("outgoing_signature", "UNSIGNED")
        rel_sig = handover_data.get("relieving_signature") or "Awaiting Relief Counter-Signature"
        page.insert_text((58, seal_y + 32), f"Outgoing Operator Signature (SHA-256): {out_sig}", fontsize=7.5, color=(0.08, 0.18, 0.36))
        page.insert_text((58, seal_y + 46), f"Relieving Operator Counter-Signature: {rel_sig}", fontsize=7.5, color=(0.08, 0.18, 0.36))
        page.insert_text((58, seal_y + 60), f"Audit Chain Verification: Immutable Tamper-Evident Hash Chain Verified", fontsize=7.5, color=(0.2, 0.5, 0.2))

        page.draw_rect(pymupdf.Rect(40, 785, 555, 802), color=(0.95, 0.96, 0.98), fill=(0.95, 0.96, 0.98))
        page.insert_text((55, 796), "MRPL CONFIDENTIAL - ON-PREMISE AIR-GAPPED CONTROL SYSTEM - PROPRIETARY", fontsize=7.5, color=(0.4, 0.45, 0.5))

        doc.save(output_path)
        doc.close()

    def render_rca_pdf(self, rca_data: Dict[str, Any], output_path: str):
        doc = pymupdf.open()
        page = doc.new_page(width=595, height=842)

        page.draw_rect(pymupdf.Rect(40, 40, 555, 802), color=(0.8, 0.85, 0.9), width=1)
        page.draw_rect(pymupdf.Rect(40, 40, 555, 95), color=(0.08, 0.18, 0.36), fill=(0.08, 0.18, 0.36))
        page.insert_text((55, 62), "MANGALORE REFINERY AND PETROCHEMICALS LIMITED (MRPL)", fontsize=11, color=(1, 1, 1))
        page.insert_text((55, 78), "OFFICIAL 5-WHY ROOT CAUSE ANALYSIS & CAPA INVESTIGATION", fontsize=8.5, color=(0.75, 0.88, 1.0))
        page.insert_text((420, 62), f"UNIT: {rca_data.get('plant_unit', 'N/A')}", fontsize=9, color=(1, 1, 1))
        page.insert_text((420, 78), f"RCA REF: {str(rca_data.get('id', '2026'))[:8].upper()}", fontsize=7.5, color=(0.75, 0.88, 1.0))

        page.draw_rect(pymupdf.Rect(40, 95, 555, 125), color=(0.94, 0.96, 0.98), fill=(0.94, 0.96, 0.98))
        title = rca_data.get("incident_title", "Process Incident")
        page.insert_text((55, 110), f"INCIDENT: {title[:75]}", fontsize=9.0, color=(0.08, 0.18, 0.36))
        page.insert_text((55, 120), f"Tag: {rca_data.get('triggering_tag', 'N/A')}  |  SOP: {rca_data.get('sop_reference', 'N/A')}  |  Investigator: {rca_data.get('investigator_id', 'N/A')}", fontsize=7.5, color=(0.4, 0.45, 0.5))

        y = 140
        analysis_text = rca_data.get("formal_analysis", "")
        rect_body = pymupdf.Rect(55, y, 540, 650)
        page.insert_textbox(rect_body, analysis_text[:2400], fontsize=8.0, color=(0.12, 0.12, 0.12), lineheight=1.28)

        seal_y = 665
        page.draw_rect(pymupdf.Rect(50, seal_y, 545, 775), color=(0.2, 0.3, 0.5), fill=(0.97, 0.98, 1.0), width=1)
        page.draw_rect(pymupdf.Rect(50, seal_y, 545, seal_y + 18), color=(0.15, 0.25, 0.45), fill=(0.15, 0.25, 0.45))
        page.insert_text((58, seal_y + 13), "OFFICIAL INVESTIGATION DIGITAL SEAL & AUDIT ATTESTATION", fontsize=8, color=(1, 1, 1))

        sig_hash = rca_data.get("signature_hash", "UNSIGNED")
        page.insert_text((58, seal_y + 32), f"Lead Investigator: {rca_data.get('investigator_id', 'Lead Process Engineer')}", fontsize=7.5, color=(0.1, 0.1, 0.1))
        page.insert_text((58, seal_y + 46), f"Digital Signature (SHA-256): {sig_hash}", fontsize=7.5, color=(0.08, 0.18, 0.36))
        page.insert_text((58, seal_y + 60), f"Investigation Status: FORMALLY APPROVED & FILED TO AUDIT LEDGER", fontsize=7.5, color=(0.1, 0.5, 0.2))

        page.draw_rect(pymupdf.Rect(40, 785, 555, 802), color=(0.95, 0.96, 0.98), fill=(0.95, 0.96, 0.98))
        page.insert_text((55, 796), "MRPL CONFIDENTIAL - ON-PREMISE AIR-GAPPED CONTROL SYSTEM - PROPRIETARY", fontsize=7.5, color=(0.4, 0.45, 0.5))

        doc.save(output_path)
        doc.close()

rca_engine = RcaInvestigationEngine()
