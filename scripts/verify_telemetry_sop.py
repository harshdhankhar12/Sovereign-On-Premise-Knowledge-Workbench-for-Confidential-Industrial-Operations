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
    print("  VERIFYING REAL-TIME DCS TELEMETRY & SOP CHECKLIST CORRELATION      ")
    print("  MANGALORE REFINERY & PETROCHEMICALS LIMITED (MRPL) - SIH26117      ")
    print("=====================================================================")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=20.0) as client:
        print("\n--- 1. Testing Live DCS Telemetry Stream (Nominal Steady-State) ---")
        res = await client.get("/api/v1/telemetry/live")
        assert res.status_code == 200, f"Failed: {res.text}"
        snap = res.json()
        assert len(snap["units"]) == 3, f"Expected 3 units, got {len(snap['units'])}"
        unit_ids = [u["unit_id"] for u in snap["units"]]
        print(f"  [PASS] Successfully retrieved telemetry for refinery units: {unit_ids}")
        assert snap["overall_status"] == "NORMAL"
        print(f"  [PASS] Nominal Overall Status: [{snap['overall_status']}] (Active Alarms: {snap['active_alarms_count']})")

        print("\n--- 2. Testing Fault Injection: CDU Furnace Overheat (TT-102 > 385°C) ---")
        res_fault = await client.post(
            "/api/v1/telemetry/inject-fault",
            json={"fault_type": "CDU_FURNACE_OVERHEAT"},
        )
        assert res_fault.status_code == 200
        snap_fault = res_fault.json()
        assert snap_fault["overall_status"] == "CRITICAL"
        cdu_unit = next(u for u in snap_fault["units"] if u["unit_id"] == "CDU-1")
        tt102 = next(s for s in cdu_unit["sensors"] if s["tag"] == "TT-102")
        print(f"  [PASS] Fault Injected: TT-102 = {tt102['value']}°C (Trip Threshold: {tt102['trip_threshold']}°C, Status: {tt102['status']})")
        assert tt102["status"] == "CRITICAL"

        print("\n--- 3. Testing Real-Time SOP Emergency Checklist Cross-Correlation ---")
        res_alarms = await client.get("/api/v1/telemetry/alarms")
        assert res_alarms.status_code == 200
        alarms_data = res_alarms.json()
        assert alarms_data["total_active"] >= 1
        cdu_alarm = next((a for a in alarms_data["alarms"] if a["tag"] == "TT-102"), None)
        assert cdu_alarm is not None, "CDU TT-102 alarm not found in active alarms!"
        print(f"  [PASS] Correlated Alarm ID: {cdu_alarm['alarm_id']}")
        print(f"         Grounded SOP Document: {cdu_alarm['sop_doc_id']} ('{cdu_alarm['sop_title']}')")
        print(f"         Clearance Tier Gate: [{cdu_alarm['sop_clearance']}]")
        print(f"         Connected P&ID Assets: {cdu_alarm['connected_equipment']}")
        assert len(cdu_alarm["checklist"]) == 5
        print(f"  [PASS] Generated {len(cdu_alarm['checklist'])} Prioritized Emergency Execution Steps:")
        for step in cdu_alarm["checklist"]:
            print(f"         * [{step['priority']}] Step {step['sequence']}: {step['action']} (Tags: {step['associated_tags']})")

        print("\n--- 4. Testing Operator Checklist Step Execution & Acknowledgment ---")
        target_step_id = cdu_alarm["checklist"][0]["step_id"]
        res_ack = await client.post(
            "/api/v1/telemetry/acknowledge-step",
            json={
                "alarm_id": cdu_alarm["alarm_id"],
                "step_id": target_step_id,
                "operator_role": "Process Engineer",
            },
        )
        assert res_ack.status_code == 200
        ack_data = res_ack.json()
        assert ack_data["completed"] is True
        assert ack_data["completed_by"] == "Process Engineer"
        print(f"  [PASS] Step '{target_step_id}' marked COMPLETED by '{ack_data['completed_by']}' at {ack_data['completed_at']}")

        print("\n--- 5. Testing Cryptographic Audit Ledger Traceability & Chain Integrity ---")
        async with AsyncSessionLocal() as session:
            integrity = await audit_service.verify_chain_integrity(session)
            assert integrity["integrity_valid"] is True, f"Audit chain broken: {integrity}"
            print(f"  [PASS] Cryptographic SHA-256 Ledger Verified (Total Records: {integrity['total_records_verified']}, Chain Valid: {integrity['integrity_valid']})")

        print("\n--- 6. Testing Telemetry Reset to Nominal Baseline ---")
        res_reset = await client.post("/api/v1/telemetry/reset")
        assert res_reset.status_code == 200
        snap_reset = res_reset.json()
        assert snap_reset["overall_status"] == "NORMAL"
        assert snap_reset["active_alarms_count"] == 0
        print(f"  [PASS] Telemetry Reset Complete. Units returned to steady state (Active Alarms: 0)")

    print("\n=====================================================================")
    print("  FEATURE 11 DCS TELEMETRY & SOP ENGINE: 100% VERIFIED & COMPLIANT   ")
    print("=====================================================================")

if __name__ == "__main__":
    asyncio.run(main())
