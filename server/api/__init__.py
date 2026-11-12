from server.api.documents import router as documents_router
from server.api.sandbox import router as sandbox_router
from server.api.agent import router as agent_router
from server.api.tasks import router as tasks_router
from server.api.websocket import router as websocket_router
from server.api.drawings import router as drawings_router
from server.api.audit import router as audit_router

__all__ = [
    "documents_router",
    "sandbox_router",
    "agent_router",
    "tasks_router",
    "websocket_router",
    "drawings_router",
    "audit_router",
]
