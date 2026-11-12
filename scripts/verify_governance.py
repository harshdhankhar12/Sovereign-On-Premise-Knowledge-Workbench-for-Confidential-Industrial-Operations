import os
import sys
import asyncio
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.main import app

async def main():
    print("=====================================================================")
    print("  VERIFYING AUTOMATED DRAFTING, GOVERNANCE & ROI METRICS ENGINE      ")
    print("=====================================================================")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=60.0) as client:
        print("\n--- 1. Testing Technical Note Drafting ---")
        draft_payload = {
            "action_type": "EQUIPMENT_MODIFICATION",
            "title": "MOC: FCCU Slurry Pump P-201A Impeller Upgrade",
            "plant_unit": "FCCU",
            "prompt": (
                "Propose replacement of standard impeller on slurry pump P-201A with a tungsten-carbide hardened "
                "impeller to mitigate catalyst slurry abrasion, reduce baseline vibration under 2.8 mm/s RMS, "
                "and ensure full compliance with ISO 10816-3 standards."
            ),
            "user_id": "mechanical_lead_sarah",
        }
        res_draft = await client.post("/api/v1/governance/draft", json=draft_payload)
        assert res_draft.status_code == 200, f"Drafting failed: {res_draft.text}"
        draft_data = res_draft.json()
        approval_id = draft_data["id"]
        assert draft_data["status"] == "PENDING"
        assert len(draft_data["draft_content"]) > 100
        print(f"  [PASS] Draft generated successfully (ID: {approval_id})")
        print(f"         Status: {draft_data['status']} | Unit: {draft_data['plant_unit']}")

        print("\n--- 2. Testing Approvals Listing & Fetch ---")
        res_list = await client.get("/api/v1/governance/approvals?status=PENDING")
        assert res_list.status_code == 200
        approvals = res_list.json()
        assert any(a["id"] == approval_id for a in approvals)
        print(f"  [PASS] Retrieved {len(approvals)} pending approval requests")

        res_single = await client.get(f"/api/v1/governance/approvals/{approval_id}")
        assert res_single.status_code == 200
        print(f"  [PASS] Fetched single approval request details")

        print("\n--- 3. Testing Human-in-the-Loop Sign-Off & Signature ---")
        action_payload = {
            "action": "APPROVE",
            "engineer_edits": (
                draft_data["draft_content"] +
                "\n\n[ENGINEER ADDENDUM]: Mandatory verification of API Plan 53B barrier fluid pressure "
                "at exactly 3.5 bar gauge prior to energizing pump motor."
            ),
            "reviewer_id": "operations_manager_rajesh",
            "reviewer_role": "PLANT_MANAGER",
            "review_notes": "Approved following cross-verification of hydraulic head loss and vibration limits.",
        }
        res_action = await client.post(f"/api/v1/governance/approvals/{approval_id}/action", json=action_payload)
        assert res_action.status_code == 200, f"Action failed: {res_action.text}"
        action_data = res_action.json()
        assert action_data["status"] == "APPROVED"
        assert action_data["signature_hash"] is not None
        assert len(action_data["signature_hash"]) == 64
        print(f"  [PASS] Approval signed off successfully:")
        print(f"         Status: {action_data['status']}")
        print(f"         Signatory: {action_data['reviewer_id']}")
        print(f"         Digital Signature (SHA-256): {action_data['signature_hash']}")

        print("\n--- 4. Testing Official Watermarked PDF Export ---")
        res_pdf = await client.get(f"/api/v1/governance/approvals/{approval_id}/export-pdf")
        assert res_pdf.status_code == 200
        assert res_pdf.headers["content-type"] == "application/pdf"
        assert len(res_pdf.content) > 1000
        print(f"  [PASS] Official stamped PDF generated ({len(res_pdf.content)} bytes)")

        print("\n--- 5. Testing Operational Productivity & ROI Telemetry ---")
        res_roi = await client.get("/api/v1/governance/metrics/roi")
        assert res_roi.status_code == 200
        roi_data = res_roi.json()
        assert roi_data["total_tasks_automated"] >= 1
        assert roi_data["cumulative_hours_saved"] > 0
        assert roi_data["speedup_percentage"] > 90.0
        print(f"  [PASS] Plant ROI Metrics:")
        print(f"         Total Tasks Automated:     {roi_data['total_tasks_automated']}")
        print(f"         Cumulative Hours Saved:    {roi_data['cumulative_hours_saved']} hrs")
        print(f"         Estimated Cost Saved:      Rs. {roi_data['cumulative_cost_saved_inr']}")
        print(f"         Average Turnaround:        {roi_data['average_turnaround_seconds']}s")
        print(f"         Process Acceleration:      {roi_data['speedup_percentage']}%")
        print(f"         Unit Breakdown:            {[u['unit'] for u in roi_data['unit_breakdown']]}")

        print("\n--- 6. Verifying Cryptographic Audit Ledger After Sign-Off ---")
        from server.core.security import create_access_token
        token_aud = create_access_token("auditor_vikram", "SAFETY_AUDITOR")
        res_audit = await client.get(
            "/api/v1/audit/verify-chain",
            headers={"Authorization": f"Bearer {token_aud}"},
        )
        assert res_audit.status_code == 200
        audit_data = res_audit.json()
        assert audit_data["integrity_valid"] is True
        print(f"  [PASS] Cryptographic audit chain: 100% VALID ({audit_data['total_records_verified']} events verified)")

    print("\n=====================================================================")
    print("  ALL GOVERNANCE & ROI TESTS COMPLETED WITH 100% SUCCESS PASS RATE   ")
    print("=====================================================================")

if __name__ == "__main__":
    asyncio.run(main())

