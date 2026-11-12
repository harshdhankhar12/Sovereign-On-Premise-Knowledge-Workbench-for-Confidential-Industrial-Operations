from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from server.core.config import settings
from server.core.database import engine
from server.core.queue import queue_manager
from server.worker.task_worker import task_worker
from server.api.documents import router as documents_router
from server.api.sandbox import router as sandbox_router
from server.api.agent import router as agent_router
from server.api.tasks import router as tasks_router
from server.api.websocket import router as websocket_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    task_worker.start()
    yield
    await task_worker.stop()
    await queue_manager.close()
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router, prefix=settings.API_V1_PREFIX)
app.include_router(sandbox_router, prefix=settings.API_V1_PREFIX)
app.include_router(agent_router, prefix=settings.API_V1_PREFIX)
app.include_router(tasks_router, prefix=settings.API_V1_PREFIX)
app.include_router(websocket_router, prefix=settings.API_V1_PREFIX)
app.include_router(websocket_router, prefix="")

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "air_gapped": True,
        "docs": "/docs",
    }

@app.get("/health")
async def health_check():
    db_status = "unknown"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    redis_status = "unknown"
    try:
        client = queue_manager.get_client()
        pong = await client.ping()
        redis_status = "connected" if pong else "disconnected"
    except Exception as e:
        redis_status = f"unreachable: {str(e)}"

    return {
        "status": "ok" if (db_status == "connected" and redis_status == "connected") else "degraded",
        "database": db_status,
        "redis": redis_status,
        "worker_running": task_worker._running,
        "embedding_model": settings.EMBEDDING_MODEL,
        "llm_model": settings.LLM_MODEL,
    }
