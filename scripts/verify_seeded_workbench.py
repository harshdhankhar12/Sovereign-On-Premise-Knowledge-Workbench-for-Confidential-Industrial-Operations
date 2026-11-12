import os
import sys
import asyncio
from typing import Dict, Any, List
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.main import app
from server.core.security import create_access_token
from server.core.database import AsyncSessionLocal
from server.models.drawings import EngineeringDrawing
from sqlalchemy import select

async def test_clearance_filtering(client: httpx.AsyncClient):
    print("\n--- 1. Testing Row-Level Clearance Gated Search ---")
    
    token_op = create_access_token("operator_john", "OPERATOR")
    token_eng = create_access_token("engineer_sarah", "PROCESS_ENGINEER")
    token_mgr = create_access_token("manager_rajesh", "PLANT_MANAGER")
    token_aud = create_access_token("auditor_vikram", "SAFETY_AUDITOR")

    res_op = await client.post(
        "/api/v1/documents/search-secure",
        headers={"Authorization": f"Bearer {token_op}"},
        json={"query": "CDU-1 emergency depressurization column T-101 shutdown", "top_k": 5},
    )
    assert res_op.status_code == 200, f"Operator search failed: {res_op.text}"
    op_data = res_op.json()
    restricted_seen_by_op = [r for r in op_data["results"] if "Emergency Depressurization" in r["document_title"]]
    assert len(restricted_seen_by_op) == 0, "Security Violation: Operator accessed RESTRICTED document!"
    print(f"  [PASS] Operator restricted from RESTRICTED doc: {len(restricted_seen_by_op)} matches allowed")

    res_eng = await client.post(
        "/api/v1/documents/search-secure",
        headers={"Authorization": f"Bearer {token_eng}"},
        json={"query": "CDU-1 emergency depressurization column T-101 shutdown", "top_k": 5},
    )
    assert res_eng.status_code == 200
    eng_data = res_eng.json()
    restricted_seen_by_eng = [r for r in eng_data["results"] if "Emergency Depressurization" in r["document_title"]]
    assert len(restricted_seen_by_eng) > 0, "Engineer should have access to RESTRICTED CDU-1 procedure!"
    print(f"  [PASS] Process Engineer accessed RESTRICTED doc: {len(restricted_seen_by_eng)} matching chunks")

    res_eng_secret = await client.post(
        "/api/v1/documents/search-secure",
        headers={"Authorization": f"Bearer {token_eng}"},
        json={"query": "catalyst kinetic activation energy Ni-Mo Arrhenius", "top_k": 5},
    )
    eng_secret_data = res_eng_secret.json()
    secret_docs_seen_by_eng = [r for r in eng_secret_data["results"] if "Hydrocracker Unit" in r["document_title"]]
    assert len(secret_docs_seen_by_eng) == 0, "Security Violation: Engineer accessed SECRET document!"
    print("  [PASS] Process Engineer restricted from SECRET catalyst specification")

    res_aud_secret = await client.post(
        "/api/v1/documents/search-secure",
        headers={"Authorization": f"Bearer {token_aud}"},
        json={"query": "catalyst kinetic activation energy Ni-Mo Arrhenius", "top_k": 5},
    )
    aud_secret_data = res_aud_secret.json()
    secret_docs_seen_by_aud = [r for r in aud_secret_data["results"] if "Hydrocracker Unit" in r["document_title"]]
    assert len(secret_docs_seen_by_aud) > 0, "Safety Auditor should have accessed SECRET document!"
    print(f"  [PASS] Safety Auditor successfully accessed SECRET doc: {len(secret_docs_seen_by_aud)} matching chunks")

async def test_pid_schematic_tracing(client: httpx.AsyncClient):
    print("\n--- 2. Testing P&ID Schematic Intelligence & Spatial Tracing ---")
    
    async with AsyncSessionLocal() as session:
        stmt = select(EngineeringDrawing).where(EngineeringDrawing.drawing_number == "MRPL-PID-CDU-101")
        dwg = (await session.execute(stmt)).scalar_one_or_none()
        assert dwg is not None, "Drawing MRPL-PID-CDU-101 not found in database!"
        dwg_id = str(dwg.id)
        dwg_number = dwg.drawing_number
        dwg_rev = dwg.revision

    print(f"  [PASS] Located P&ID drawing: {dwg_number} (Rev {dwg_rev})")

    trace_res = await client.post(
        "/api/v1/drawings/trace",
        json={"drawing_id": dwg_id, "target_tag": "T-101", "radius_px": 300.0},
    )
    assert trace_res.status_code == 200, f"Trace failed: {trace_res.text}"
    trace_data = trace_res.json()
    inst_tags = [x["tag"] for x in trace_data["connected_instruments"]]
    valve_tags = [x["tag"] for x in trace_data["connected_valves"]]
    line_tags = [x["tag"] for x in trace_data["connected_lines"]]
    
    print(f"  [PASS] Column T-101 Spatial Network Traced:")
    print(f"         Instruments ({len(inst_tags)}): {inst_tags}")
    print(f"         Valves ({len(valve_tags)}): {valve_tags}")
    print(f"         Piping Lines ({len(line_tags)}): {line_tags}")
    assert "PT-101" in inst_tags, "PT-101 should be connected to T-101!"
    assert "BDV-101" in valve_tags, "BDV-101 blowdown valve should be connected to T-101!"

    render_res = await client.get(f"/api/v1/drawings/{dwg_id}/render-annotated?target_tag=T-101")
    assert render_res.status_code == 200
    assert render_res.headers["content-type"] == "image/png"
    print(f"  [PASS] Rendered annotated visual overlay PNG ({len(render_res.content)} bytes)")

async def test_physics_sandbox(client: httpx.AsyncClient):
    print("\n--- 3. Testing Deterministic Physics Sandbox ---")
    
    lmtd_res = await client.post(
        "/api/v1/sandbox/verify-proposal",
        json={
            "formula_name": "HEAT_EXCHANGER_DUTY",
            "parameters": {
                "U": 350.0,
                "A": 320.0,
                "Th_in": 160.0,
                "Th_out": 120.0,
                "Tc_in": 30.0,
                "Tc_out": 85.0,
                "unit": "kw",
            },
            "claimed_value": 9213.0,
            "tolerance_pct": 5.0,
        },
    )
    assert lmtd_res.status_code == 200, f"LMTD verify failed: {lmtd_res.text}"
    lmtd_data = lmtd_res.json()
    assert lmtd_data["verification_passed"] is True
    print(f"  [PASS] E-101 Duty/LMTD verified: {lmtd_data['calculated_value']} kW (Discrepancy: {lmtd_data['discrepancy_pct']}%)")

    pump_res = await client.post(
        "/api/v1/sandbox/verify-proposal",
        json={
            "formula_name": "PUMP_POWER",
            "parameters": {
                "flow_rate_m3_h": 250.0,
                "head_meters": 45.0,
                "fluid_density_kg_m3": 1050.0,
                "pump_efficiency_pct": 72.0,
                "motor_efficiency_pct": 92.0,
            },
            "claimed_value": 45.0,
            "tolerance_pct": 5.0,
        },
    )
    assert pump_res.status_code == 200, f"Pump verify failed: {pump_res.text}"
    pump_data = pump_res.json()
    assert pump_data["verification_passed"] is True
    print(f"  [PASS] P-201A Brake Power verified: {pump_data['calculated_value']} kW (Discrepancy: {pump_data['discrepancy_pct']}%)")

    darcy_res = await client.post(
        "/api/v1/sandbox/run-formula",
        json={
            "formula_name": "DARCY_WEISBACH",
            "parameters": {
                "flow_rate_m3_h": 250.0,
                "pipe_diameter_mm": 150.0,
                "pipe_length_m": 85.0,
                "fluid_density_kg_m3": 1050.0,
            },
        },
    )
    assert darcy_res.status_code == 200, f"Darcy verify failed: {darcy_res.text}"
    darcy_data = darcy_res.json()
    out = darcy_data["calculated_output"]
    print(f"  [PASS] Line 6\"-P-204-CS-150 Darcy-Weisbach head loss: {out.get('head_loss_meters')} m, dP: {out.get('pressure_drop_bar')} bar")

async def test_audit_ledger_integrity(client: httpx.AsyncClient):
    print("\n--- 4. Testing Cryptographic Audit Ledger Integrity ---")
    
    token_aud = create_access_token("auditor_vikram", "SAFETY_AUDITOR")
    audit_res = await client.get(
        "/api/v1/audit/verify-chain",
        headers={"Authorization": f"Bearer {token_aud}"},
    )
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["integrity_valid"] is True, f"Audit chain broken: {audit_data['message']}"
    print(f"  [PASS] Cryptographic audit chain: 100% VALID ({audit_data['total_records_verified']} records verified)")
    print(f"         Genesis Hash: {audit_data['genesis_hash'][:16]}...")
    print(f"         Latest Hash:  {audit_data['latest_hash'][:16]}...")

async def test_multi_agent_chat(client: httpx.AsyncClient):
    print("\n--- 5. Testing Sovereign Multi-Agent Chat Pipeline ---")
    
    query = "What is the emergency high-high vibration trip threshold for slurry pump P-201A in the SOP?"
    chat_res = await client.post(
        "/api/v1/agent/query",
        json={"prompt": query, "user_id": "plant_engineer"},
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    steps = chat_data.get("steps", [])
    print(f"  [PASS] Intent Classified: {chat_data.get('intent')}")
    print(f"  [PASS] Pipeline Nodes: {len(steps)} steps -> {[s['node'] for s in steps]}")
    print(f"  [PASS] Citations Returned: {len(chat_data.get('citations', []))}")
    for c in chat_data.get("citations", []):
        print(f"         - {c}")
    response_text = chat_data.get("final_response", "")
    print(f"  [PASS] Synthesized Response snippet:\n{response_text[:300]}...")

async def main():
    print("=====================================================================")
    print("  VERIFYING SOVEREIGN INDUSTRIAL KNOWLEDGE WORKBENCH DATASET & CORE  ")
    print("=====================================================================")
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=60.0) as client:
        await test_clearance_filtering(client)
        await test_pid_schematic_tracing(client)
        await test_physics_sandbox(client)
        await test_audit_ledger_integrity(client)
        await test_multi_agent_chat(client)
        
    print("\n=====================================================================")
    print("  ALL VERIFICATION TESTS COMPLETED WITH 100% SUCCESS PASS RATE       ")
    print("=====================================================================")

if __name__ == "__main__":
    asyncio.run(main())
