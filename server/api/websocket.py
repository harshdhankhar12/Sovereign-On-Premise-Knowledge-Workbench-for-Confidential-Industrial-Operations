import json
import asyncio
from typing import Dict, Set
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from server.core.queue import queue_manager
from server.core.database import AsyncSessionLocal
from server.models.agent import AgentTask

router = APIRouter(tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, task_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = set()
        self.active_connections[task_id].add(websocket)

    def disconnect(self, task_id: str, websocket: WebSocket) -> None:
        if task_id in self.active_connections:
            self.active_connections[task_id].discard(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

    async def send_json(self, websocket: WebSocket, message: dict) -> None:
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, task_id: str, message: dict) -> None:
        if task_id in self.active_connections:
            dead_sockets = set()
            for ws in self.active_connections[task_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.disconnect(task_id, ws)

manager = ConnectionManager()

@router.websocket("/ws/tasks/{task_id}")
async def task_websocket_endpoint(websocket: WebSocket, task_id: str):
    await manager.connect(task_id, websocket)

    current_state = await queue_manager.get_task_state(task_id)
    if not current_state:
        try:
            task_uuid = UUID(task_id)
            async with AsyncSessionLocal() as session:
                stmt = select(AgentTask).where(AgentTask.id == task_uuid)
                rec = (await session.execute(stmt)).scalar_one_or_none()
                if rec:
                    current_state = {
                        "task_id": task_id,
                        "status": rec.status,
                        "intent": rec.intent,
                        "final_response": rec.final_response,
                        "citations": rec.citations or [],
                    }
        except Exception:
            pass

    if current_state:
        await manager.send_json(websocket, {
            "task_id": task_id,
            "event_type": "INITIAL_STATE",
            "data": current_state,
        })

    pubsub = await queue_manager.subscribe_events(task_id)

    async def receive_from_client():
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    parsed = json.loads(data)
                    action = parsed.get("action")
                    if action == "ping":
                        await manager.send_json(websocket, {"event_type": "PONG"})
                    elif action == "cancel":
                        await queue_manager.set_cancel_flag(task_id)
                        await queue_manager.publish_event(
                            task_id,
                            "TASK_CANCELLED",
                            {"task_id": task_id, "message": "Task cancellation requested by client."},
                        )
                except Exception:
                    pass
        except WebSocketDisconnect:
            pass
        except Exception:
            pass

    async def forward_pubsub_events():
        try:
            async for msg in pubsub.listen():
                if msg and msg.get("type") == "message":
                    raw_data = msg.get("data")
                    if raw_data:
                        try:
                            event_obj = json.loads(raw_data)
                            await manager.send_json(websocket, event_obj)
                            etype = event_obj.get("event_type")
                            if etype in ["TASK_COMPLETED", "TASK_FAILED", "TASK_CANCELLED"]:
                                await asyncio.sleep(0.5)
                                break
                        except Exception:
                            pass
        except asyncio.CancelledError:
            pass
        except Exception:
            pass

    t_recv = asyncio.create_task(receive_from_client())
    t_fwd = asyncio.create_task(forward_pubsub_events())

    done, pending = await asyncio.wait(
        [t_recv, t_fwd],
        return_when=asyncio.FIRST_COMPLETED,
    )

    for p in pending:
        p.cancel()
        try:
            await p
        except asyncio.CancelledError:
            pass

    try:
        await pubsub.unsubscribe()
        await pubsub.close()
    except Exception:
        pass

    manager.disconnect(task_id, websocket)

