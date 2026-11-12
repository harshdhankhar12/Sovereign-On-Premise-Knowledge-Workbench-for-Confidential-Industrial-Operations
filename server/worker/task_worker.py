import asyncio
import time
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from server.core.database import AsyncSessionLocal
from server.core.queue import queue_manager
from server.models.agent import AgentTask, TaskStep
from server.agent.graph import agent_workflow
from server.sandbox.formulas import (
    calculate_heat_exchanger_duty,
    calculate_darcy_weisbach_loss,
    calculate_centrifugal_pump_power,
    detect_outliers_and_stats,
)

QUEUE_NAME = "sovereign_task_queue"

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class AsyncTaskWorker:
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None

    def start(self) -> None:
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._worker_loop())

    async def stop(self) -> None:
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _worker_loop(self) -> None:
        while self._running:
            try:
                payload = await queue_manager.dequeue(QUEUE_NAME, timeout=1)
                if payload:
                    await self._process_task(payload)
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(1)

    async def _process_task(self, payload: Dict[str, Any]) -> None:
        task_id = payload.get("task_id")
        task_type = payload.get("task_type", "AGENT_QUERY")
        t0 = time.perf_counter()

        if not task_id:
            return

        if await queue_manager.is_cancelled(task_id):
            await queue_manager.publish_event(task_id, "TASK_CANCELLED", {"task_id": task_id, "message": "Task cancelled before start."})
            return

        await queue_manager.publish_event(
            task_id,
            "TASK_STARTED",
            {
                "task_id": task_id,
                "task_type": task_type,
                "started_at": utc_now().isoformat(),
            }
        )

        async with AsyncSessionLocal() as session:
            try:
                task_uuid = UUID(task_id)
                stmt = select(AgentTask).where(AgentTask.id == task_uuid)
                task_record = (await session.execute(stmt)).scalar_one_or_none()
                if task_record:
                    task_record.status = "RUNNING"
                    await session.commit()

                if task_type == "AGENT_QUERY":
                    prompt = payload.get("prompt", "")
                    plant_unit = payload.get("plant_unit")
                    doc_type = payload.get("doc_type")
                    user_id = payload.get("user_id", "engineer")
                    top_k = payload.get("top_k", 4)
                    formula_params = payload.get("formula_params")
                    claimed_value = payload.get("claimed_value")

                    final_state = await agent_workflow.execute(
                        prompt=prompt,
                        session=session,
                        task_id=task_id,
                        plant_unit=plant_unit,
                        doc_type=doc_type,
                        user_id=user_id,
                        top_k=top_k,
                        formula_params=formula_params,
                        claimed_value=claimed_value,
                    )

                    duration_sec = round(time.perf_counter() - t0, 2)

                    if task_record:
                        for s in final_state.get("steps", []):
                            step_rec = TaskStep(
                                task_id=task_record.id,
                                node_name=s["node"],
                                step_status=s["status"],
                                step_message=s["message"],
                                duration_ms=s["duration_ms"],
                            )
                            session.add(step_rec)

                        task_record.status = "COMPLETED"
                        task_record.intent = final_state.get("intent")
                        task_record.final_response = final_state.get("final_response")
                        task_record.citations = final_state.get("citations", [])
                        task_record.completed_at = utc_now()
                        await session.commit()

                    completed_data = {
                        "task_id": task_id,
                        "status": "COMPLETED",
                        "intent": final_state.get("intent"),
                        "final_response": final_state.get("final_response"),
                        "citations": final_state.get("citations", []),
                        "sandbox_output": final_state.get("sandbox_output"),
                        "verification_passed": final_state.get("verification_passed"),
                        "duration_seconds": duration_sec,
                    }
                    await queue_manager.set_task_state(task_id, completed_data)
                    await queue_manager.publish_event(task_id, "TASK_COMPLETED", completed_data)

                elif task_type == "FORMULA_CALCULATION":
                    f_name = payload.get("formula_name")
                    p = payload.get("formula_params") or {}
                    calc_res = None

                    if f_name == "HEAT_EXCHANGER_DUTY":
                        calc_res = calculate_heat_exchanger_duty(
                            U=float(p.get("U", 450)),
                            A=float(p.get("A", 35)),
                            Th_in=float(p.get("Th_in", 150)),
                            Th_out=float(p.get("Th_out", 90)),
                            Tc_in=float(p.get("Tc_in", 30)),
                            Tc_out=float(p.get("Tc_out", 70)),
                            flow_arrangement=str(p.get("flow_arrangement", "counter")),
                        )
                    elif f_name == "DARCY_WEISBACH":
                        calc_res = calculate_darcy_weisbach_loss(
                            flow_rate_m3_h=float(p.get("flow_rate_m3_h", 100)),
                            pipe_diameter_mm=float(p.get("pipe_diameter_mm", 150)),
                            pipe_length_m=float(p.get("pipe_length_m", 50)),
                        )
                    elif f_name == "PUMP_POWER":
                        calc_res = calculate_centrifugal_pump_power(
                            flow_rate_m3_h=float(p.get("flow_rate_m3_h", 200)),
                            head_meters=float(p.get("head_meters", 80)),
                        )
                    elif f_name == "OUTLIER_STATS":
                        calc_res = detect_outliers_and_stats(
                            readings=p.get("readings", []),
                            threshold_sigma=float(p.get("threshold_sigma", 2.0)),
                        )

                    duration_sec = round(time.perf_counter() - t0, 2)

                    if task_record:
                        task_record.status = "COMPLETED"
                        task_record.intent = "CALCULATION"
                        task_record.final_response = f"Formula {f_name} calculated successfully."
                        task_record.completed_at = utc_now()
                        await session.commit()

                    completed_data = {
                        "task_id": task_id,
                        "status": "COMPLETED",
                        "formula_name": f_name,
                        "sandbox_output": calc_res,
                        "duration_seconds": duration_sec,
                    }
                    await queue_manager.set_task_state(task_id, completed_data)
                    await queue_manager.publish_event(task_id, "TASK_COMPLETED", completed_data)

            except Exception as e:
                duration_sec = round(time.perf_counter() - t0, 2)
                err_data = {
                    "task_id": task_id,
                    "status": "FAILED",
                    "error": str(e),
                    "duration_seconds": duration_sec,
                }
                try:
                    if task_record:
                        task_record.status = "FAILED"
                        task_record.final_response = f"Task failed: {str(e)}"
                        task_record.completed_at = utc_now()
                        await session.commit()
                except Exception:
                    pass

                await queue_manager.set_task_state(task_id, err_data)
                await queue_manager.publish_event(task_id, "TASK_FAILED", err_data)

task_worker = AsyncTaskWorker()

