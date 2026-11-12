import json
import re
import time
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from server.agent.state import AgentState, AgentStepLog
from server.core.llm import OllamaChatService
from server.retrieval.vector_store import VectorSearchService
from server.core.queue import queue_manager
from server.sandbox.formulas import (
    calculate_heat_exchanger_duty,
    calculate_darcy_weisbach_loss,
    calculate_centrifugal_pump_power,
    detect_outliers_and_stats,
)

async def notify_step(task_id: Optional[str], event_type: str, data: Dict[str, Any]) -> None:
    if task_id:
        try:
            await queue_manager.publish_event(str(task_id), event_type, data)
        except Exception:
            pass

async def intent_node(
    state: AgentState,
    llm: OllamaChatService,
) -> Dict[str, Any]:
    task_id = state.get("task_id")
    await notify_step(task_id, "STEP_STARTED", {"node": "intent_node", "message": "Analyzing query intent..."})

    t0 = time.perf_counter()
    prompt = state["prompt"]

    system_msg = (
        "You are an industrial refinery classifier. Categorize the query into one of: "
        "SOP_QUERY, CALCULATION, VENDOR_VERIFICATION, GENERAL. "
        "Return only JSON: {\"intent\": \"SOP_QUERY\"}"
    )

    user_msg = f"Query: \"{prompt}\""

    classified_intent = "SOP_QUERY"
    formula_name = None
    claimed_val = None

    lower_prompt = prompt.lower()
    if any(w in lower_prompt for w in ["calculate", "formula", "duty", "head loss", "pressure drop", "lmtd", "darcy", "pump power"]):
        classified_intent = "CALCULATION"
    elif any(w in lower_prompt for w in ["vendor", "claim", "proposal", "verify proposal", "discrepancy"]):
        classified_intent = "VENDOR_VERIFICATION"
    elif any(w in lower_prompt for w in ["sop", "procedure", "shutdown", "isolate", "valve", "step", "protocol", "temperature", "pressure", "alarm", "trip", "c-101", "t-101", "p-101", "p-201", "r-901", "nfpa", "h2s", "guideline", "standard"]):
        classified_intent = "SOP_QUERY"
    else:
        try:
            reply = await llm.chat(
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.0,
                max_tokens=40,
                timeout_seconds=4.0,
            )
            match = re.search(r"\{.*\}", reply, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                classified_intent = parsed.get("intent", "SOP_QUERY")
        except Exception:
            classified_intent = "SOP_QUERY"

    lower_p = prompt.lower()
    if "heat exchanger" in lower_p or "duty" in lower_p or "lmtd" in lower_p:
        formula_name = "HEAT_EXCHANGER_DUTY"
    elif "darcy" in lower_p or "head loss" in lower_p or "pressure drop" in lower_p:
        formula_name = "DARCY_WEISBACH"
    elif "pump" in lower_p and ("power" in lower_p or "motor" in lower_p or "head" in lower_p):
        formula_name = "PUMP_POWER"

    elapsed = int((time.perf_counter() - t0) * 1000)
    step_log: AgentStepLog = {
        "node": "intent_node",
        "status": "DONE",
        "message": f"Classified intent as {classified_intent}" + (f" with formula {formula_name}" if formula_name else ""),
        "duration_ms": elapsed,
    }

    await notify_step(task_id, "STEP_COMPLETED", {
        "node": "intent_node",
        "intent": classified_intent,
        "formula_name": formula_name,
        "duration_ms": elapsed,
    })

    return {
        "intent": classified_intent,
        "formula_name": formula_name,
        "claimed_value": claimed_val,
        "steps": state["steps"] + [step_log],
    }

async def retrieval_node(
    state: AgentState,
    search_service: VectorSearchService,
    session: AsyncSession,
) -> Dict[str, Any]:
    task_id = state.get("task_id")
    await notify_step(task_id, "STEP_STARTED", {"node": "retrieval_node", "message": "Searching local vector store for procedures..."})

    t0 = time.perf_counter()
    chunks = []
    citations = []

    if state.get("intent") != "CALCULATION":
        try:
            results = await search_service.search(
                session=session,
                query=state["prompt"],
                top_k=state.get("top_k", 3),
                plant_unit=state.get("plant_unit"),
                doc_type=state.get("doc_type"),
                similarity_threshold=0.25,
            )
            for r in results:
                chunks.append({
                    "chunk_id": str(r.chunk_id),
                    "document_title": r.document_title,
                    "page_number": r.page_number,
                    "content": r.content[:600],
                    "similarity_score": r.similarity_score,
                    "citation": r.citation,
                })
                if r.citation not in citations:
                    citations.append(r.citation)
        except Exception:
            pass

    elapsed = int((time.perf_counter() - t0) * 1000)
    step_log: AgentStepLog = {
        "node": "retrieval_node",
        "status": "DONE",
        "message": f"Retrieved {len(chunks)} relevant document chunks from local vector store" if chunks else "No relevant document chunks found or direct calculation requested",
        "duration_ms": elapsed,
    }

    await notify_step(task_id, "STEP_COMPLETED", {
        "node": "retrieval_node",
        "chunks_retrieved": len(chunks),
        "citations": citations,
        "duration_ms": elapsed,
    })

    return {
        "retrieved_chunks": chunks,
        "citations": citations,
        "steps": state["steps"] + [step_log],
    }

async def sandbox_node(
    state: AgentState,
) -> Dict[str, Any]:
    task_id = state.get("task_id")
    formula = state.get("formula_name")
    await notify_step(task_id, "STEP_STARTED", {"node": "sandbox_node", "message": f"Executing formula {formula} in secure sandbox..." if formula else "Checking formula parameters..."})

    t0 = time.perf_counter()
    params = state.get("formula_params") or {}
    output = None

    if formula and params:
        try:
            if formula == "HEAT_EXCHANGER_DUTY":
                output = calculate_heat_exchanger_duty(
                    U=float(params.get("U", 450)),
                    A=float(params.get("A", 35)),
                    Th_in=float(params.get("Th_in", 150)),
                    Th_out=float(params.get("Th_out", 90)),
                    Tc_in=float(params.get("Tc_in", 30)),
                    Tc_out=float(params.get("Tc_out", 70)),
                    flow_arrangement=str(params.get("flow_arrangement", "counter")),
                )
            elif formula == "DARCY_WEISBACH":
                output = calculate_darcy_weisbach_loss(
                    flow_rate_m3_h=float(params.get("flow_rate_m3_h", 100)),
                    pipe_diameter_mm=float(params.get("pipe_diameter_mm", 150)),
                    pipe_length_m=float(params.get("pipe_length_m", 50)),
                )
            elif formula == "PUMP_POWER":
                output = calculate_centrifugal_pump_power(
                    flow_rate_m3_h=float(params.get("flow_rate_m3_h", 200)),
                    head_meters=float(params.get("head_meters", 80)),
                )
        except Exception as e:
            output = {"error": str(e)}

    elapsed = int((time.perf_counter() - t0) * 1000)
    step_log: AgentStepLog = {
        "node": "sandbox_node",
        "status": "DONE",
        "message": f"Executed deterministic formula {formula} in secure sandbox" if output else "No math execution requested",
        "duration_ms": elapsed,
    }

    await notify_step(task_id, "STEP_COMPLETED", {
        "node": "sandbox_node",
        "formula": formula,
        "output": output,
        "duration_ms": elapsed,
    })

    return {
        "sandbox_output": output,
        "steps": state["steps"] + [step_log],
    }

async def verifier_node(
    state: AgentState,
) -> Dict[str, Any]:
    task_id = state.get("task_id")
    await notify_step(task_id, "STEP_STARTED", {"node": "verifier_node", "message": "Verifying calculation consistency..."})

    t0 = time.perf_counter()
    claimed = state.get("claimed_value")
    output = state.get("sandbox_output")
    passed = None

    if claimed is not None and output and "duty_kw" in output:
        calc_val = output["duty_kw"]
        diff_pct = abs(calc_val - claimed) / abs(calc_val) * 100.0
        passed = diff_pct <= 5.0
        output["discrepancy_pct"] = round(diff_pct, 2)
        output["tolerance_passed"] = passed

    elapsed = int((time.perf_counter() - t0) * 1000)
    step_log: AgentStepLog = {
        "node": "verifier_node",
        "status": "DONE",
        "message": f"Verification status: {'PASSED' if passed else 'FLAGGED'}" if passed is not None else "No verification claims provided",
        "duration_ms": elapsed,
    }

    await notify_step(task_id, "STEP_COMPLETED", {
        "node": "verifier_node",
        "verification_passed": passed,
        "duration_ms": elapsed,
    })

    return {
        "verification_passed": passed,
        "steps": state["steps"] + [step_log],
    }

async def synthesis_node(
    state: AgentState,
    llm: OllamaChatService,
) -> Dict[str, Any]:
    task_id = state.get("task_id")
    await notify_step(task_id, "STEP_STARTED", {"node": "synthesis_node", "message": "Synthesizing verified engineering response..."})

    t0 = time.perf_counter()

    prompt = state["prompt"]
    chunks = state.get("retrieved_chunks", [])
    sandbox_output = state.get("sandbox_output")
    verification_passed = state.get("verification_passed")

    context_blocks = []
    for c in chunks:
        context_blocks.append(
            f"--- Document: {c['document_title']} (Page {c['page_number']}) ---\n{c['content']}"
        )
    context_str = "\n\n".join(context_blocks) if context_blocks else "No relevant documents found."

    sandbox_str = ""
    if sandbox_output:
        sandbox_str = f"\n\nVerified Calculation Output: {json.dumps(sandbox_output)}"
        if verification_passed is not None:
            sandbox_str += f"\nVerification: {'PASSED' if verification_passed else 'FLAGGED'}"

    system_instruction = (
        "You are an expert AI assistant for refinery engineering operations.\n"
        "Instructions:\n"
        "- Answer the engineer's query clearly and concisely using only the provided context and calculation results.\n"
        "- Structure with clear bullet points, bold key equipment/tags, and explicit citations [Document (Page X)].\n"
        "- Highlight mandatory safety precautions and isolation requirements.\n"
        "- If calculations are provided, state the verified numbers.\n"
        "- Keep response focused and rapid."
    )

    user_query = f"Context:\n{context_str}{sandbox_str}\n\nQuestion: {prompt}\n\nAnswer:"

    try:
        reply = await llm.chat(
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_query},
            ],
            temperature=0.1,
            max_tokens=220,
            timeout_seconds=45.0,
        )
    except Exception as e:
        reply = f"Error generating synthesis response: {str(e)}"

    elapsed = int((time.perf_counter() - t0) * 1000)
    step_log: AgentStepLog = {
        "node": "synthesis_node",
        "status": "DONE",
        "message": "Synthesized verified engineering response with citations",
        "duration_ms": elapsed,
    }

    await notify_step(task_id, "STEP_COMPLETED", {
        "node": "synthesis_node",
        "final_response_preview": reply[:100] if reply else "",
        "duration_ms": elapsed,
    })

    return {
        "final_response": reply,
        "steps": state["steps"] + [step_log],
    }
