import os
import sys
import asyncio
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.core.database import AsyncSessionLocal
from server.audit.ledger import audit_service
from server.main import app

async def main():
    print("=====================================================================")
    print("  VERIFYING SHIFT HANDOVER & 5-WHY INCIDENT RCA ENGINE               ")
    print("  MANGALORE REFINERY & PETROCHEMICALS LIMITED (MRPL) - SIH26117      ")
    print("=====================================================================")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=25.0) as client:
        print("\n--- 1. Testing RCA Incident Presets Retrieval ---")
        res_presets = await client.get("/api/v1/investigation/rca/presets")
        assert res_presets.status_code == 200, f"Failed: {res_presets.text}"
        presets = res_presets.json()
        assert len(presets) >= 3, f"Expected at least 3 presets, got {len(presets)}"
        preset_keys = [p["key"] for p in presets]
        print(f"  [PASS] Retrieved {len(presets)} RCA Incident Presets: {preset_keys}")

        print("\n--- 2. Testing Autonomous Shift Handover Generation ---")
        res_handover = await client.post(
            "/api/v1/investigation/shift-handover/generate",
            json={
                "shift_type": "MORNING",
                "outgoing_operator": "Er. Rajesh Kumar (SIC CDU-1)",
                "relieving_operator": "Er. Vikram Shetty (Relief SIC)",
            },
        )
        assert res_handover.status_code == 200, f"Failed: {res_handover.text}"
        handover = res_handover.json()
        handover_id = handover["id"]
        assert handover["shift_type"] == "MORNING"
        assert len(handover["outgoing_signature"]) == 64
        assert len(handover["standing_orders"]) >= 3
        print(f"  [PASS] Generated Shift Handover ID: {handover_id}")
        print(f"         Outgoing In-Charge: {handover['outgoing_operator']}")
        print(f"         Audited Events Count: {handover['events_count']}")
        print(f"         Standing Orders Count: {len(handover['standing_orders'])}")
        print(f"         Outgoing Signature (SHA-256): {handover['outgoing_signature']}")

        print("\n--- 3. Testing Relieving Engineer Counter-Signature ---")
        res_counter = await client.post(
            f"/api/v1/investigation/shift-handover/{handover_id}/countersign",
            json={"relieving_operator": "Er. Vikram Shetty (Relief SIC)"},
        )
        assert res_counter.status_code == 200, f"Failed: {res_counter.text}"
        counter_data = res_counter.json()
        assert counter_data["relieving_signature"] is not None
        assert len(counter_data["relieving_signature"]) == 64
        print(f"  [PASS] Dual-Signatory Seal Completed at {counter_data['countersigned_at']}")
        print(f"         Relieving Counter-Signature (SHA-256): {counter_data['relieving_signature']}")

        print("\n--- 4. Testing Official Shift Handover PDF Export ---")
        res_pdf_sh = await client.get(f"/api/v1/investigation/shift-handover/{handover_id}/export-pdf")
        assert res_pdf_sh.status_code == 200
        assert res_pdf_sh.headers["content-type"] == "application/pdf"
        assert res_pdf_sh.content.startswith(b"%PDF-")
        print(f"  [PASS] Rendered Branded Shift Handover PDF ({len(res_pdf_sh.content)} bytes)")

        print("\n--- 5. Testing 5-Why Incident Root Cause Analysis (RCA) Generation ---")
        cdu_preset = next(p for p in presets if p["key"] == "CDU_FURNACE_OVERHEAT")
        res_rca = await client.post(
            "/api/v1/investigation/rca/generate",
            json={
                "incident_title": cdu_preset["incident_title"],
                "plant_unit": cdu_preset["plant_unit"],
                "triggering_tag": cdu_preset["triggering_tag"],
                "sop_reference": cdu_preset["sop_reference"],
                "initial_observation": cdu_preset["initial_observation"],
                "investigator_id": "Lead Process Engineer - Safety Division",
            },
        )
        assert res_rca.status_code == 200, f"Failed: {res_rca.text}"
        rca = res_rca.json()
        rca_id = rca["id"]
        assert len(rca["why_steps"]) == 5, f"Expected 5 why steps, got {len(rca['why_steps'])}"
        assert len(rca["capa_items"]) >= 2, f"Expected at least 2 CAPA items, got {len(rca['capa_items'])}"
        assert len(rca["signature_hash"]) == 64
        print(f"  [PASS] Generated Formal 5-Why RCA Report ID: {rca_id}")
        print(f"         Problem: {rca['problem_statement'][:85]}...")
        print(f"         Completed 5-Why Causal Tree:")
        for w in rca["why_steps"]:
            print(f"           [Level {w['level']}] {w['question']}")
            print(f"               -> {w['answer']}")
        print(f"         CAPA Items ({len(rca['capa_items'])} actions assigned):")
        for c in rca["capa_items"]:
            print(f"           * [{c['action_type']}] {c['description']} (Owner: {c['owner']}, Deadline: {c['deadline_days']}d)")
        print(f"         Investigation Digital Seal (SHA-256): {rca['signature_hash']}")

        print("\n--- 6. Testing Official 5-Why RCA PDF Export ---")
        res_pdf_rca = await client.get(f"/api/v1/investigation/rca/{rca_id}/export-pdf")
        assert res_pdf_rca.status_code == 200
        assert res_pdf_rca.headers["content-type"] == "application/pdf"
        assert res_pdf_rca.content.startswith(b"%PDF-")
        print(f"  [PASS] Rendered Branded 5-Why RCA PDF ({len(res_pdf_rca.content)} bytes)")

        print("\n--- 7. Testing Cryptographic Audit Ledger Traceability & Chain Integrity ---")
        async with AsyncSessionLocal() as session:
            integrity = await audit_service.verify_chain_integrity(session)
            assert integrity["integrity_valid"] is True, f"Audit chain broken: {integrity}"
            print(f"  [PASS] Cryptographic SHA-256 Ledger Verified (Total Records: {integrity['total_records_verified']}, Chain Valid: {integrity['integrity_valid']})")

    print("\n=====================================================================")
    print("  FEATURE 12 SHIFT HANDOVER & 5-WHY RCA: 100% VERIFIED & COMPLIANT   ")
    print("=====================================================================")

if __name__ == "__main__":
    asyncio.run(main())
