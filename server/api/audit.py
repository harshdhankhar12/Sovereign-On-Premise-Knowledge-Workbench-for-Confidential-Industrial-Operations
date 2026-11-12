from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.core.database import get_db
from server.core.security import (
    create_access_token,
    get_current_user,
    get_allowed_clearances,
    require_role,
    ROLE_OPERATOR,
    ROLE_SAFETY_AUDITOR,
    ROLE_PLANT_MANAGER,
    ROLE_PROCESS_ENGINEER,
)
from server.models.audit import AuditLog
from server.audit.ledger import audit_service
from server.retrieval.vector_store import VectorSearchService
from server.schemas.security import (
    TokenRequest,
    TokenResponse,
    AuditLogEventRequest,
    AuditLogItem,
    AuditChainVerifyResponse,
    SecureSearchRequest,
    SecureSearchResponse,
)

router = APIRouter(tags=["security_and_audit"])
vector_service = VectorSearchService()

@router.post("/auth/token", response_model=TokenResponse)
async def generate_token(
    request: TokenRequest,
    db: AsyncSession = Depends(get_db),
):
    token = create_access_token(user_id=request.user_id, role=request.role)
    clearances = get_allowed_clearances(request.role)

    await audit_service.record_event(
        session=db,
        user_id=request.user_id,
        user_role=request.role,
        event_type="AUTH_TOKEN_ISSUED",
        details={"role": request.role, "clearances": clearances},
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=request.user_id,
        role=request.role,
        clearances=clearances,
    )

@router.get("/auth/me")
async def get_current_profile(
    current_user: Dict[str, Any] = Security(get_current_user),
):
    return {
        "user_id": current_user.get("user_id"),
        "role": current_user.get("role"),
        "clearances": current_user.get("clearances", []),
    }

@router.post("/audit/log", response_model=AuditLogItem)
async def log_audit_event(
    request: AuditLogEventRequest,
    current_user: Dict[str, Any] = Security(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await audit_service.record_event(
        session=db,
        user_id=current_user.get("user_id", "engineer"),
        user_role=current_user.get("role", ROLE_OPERATOR),
        event_type=request.event_type,
        resource_id=request.resource_id,
        details=request.details,
        task_id=request.task_id,
    )

    return AuditLogItem(
        id=record.id,
        task_id=record.task_id,
        user_id=record.user_id,
        user_role=record.user_role,
        event_type=record.event_type,
        resource_id=record.resource_id,
        details=record.details or {},
        previous_hash=record.previous_hash,
        current_hash=record.current_hash,
        timestamp=record.timestamp,
    )

@router.get("/audit/logs", response_model=List[AuditLogItem])
async def get_audit_logs(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: Dict[str, Any] = Security(require_role([ROLE_SAFETY_AUDITOR, ROLE_PLANT_MANAGER, ROLE_PROCESS_ENGINEER, ROLE_OPERATOR])),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLog).order_by(AuditLog.id.asc()).offset(offset).limit(limit)
    records = (await db.execute(stmt)).scalars().all()

    return [
        AuditLogItem(
            id=r.id,
            task_id=r.task_id,
            user_id=r.user_id,
            user_role=r.user_role,
            event_type=r.event_type,
            resource_id=r.resource_id,
            details=r.details or {},
            previous_hash=r.previous_hash,
            current_hash=r.current_hash,
            timestamp=r.timestamp,
        )
        for r in records
    ]

@router.get("/audit/verify-chain", response_model=AuditChainVerifyResponse)
async def verify_chain(
    current_user: Dict[str, Any] = Security(require_role([ROLE_SAFETY_AUDITOR, ROLE_PLANT_MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    res = await audit_service.verify_chain_integrity(db)
    return AuditChainVerifyResponse(
        integrity_valid=res["integrity_valid"],
        total_records_verified=res["total_records_verified"],
        genesis_hash=res.get("genesis_hash"),
        latest_hash=res.get("latest_hash"),
        tampered_record_id=res.get("tampered_record_id"),
        tampered_at_sequence=res.get("tampered_at_sequence"),
        message=res["message"],
    )

@router.post("/documents/search-secure", response_model=SecureSearchResponse)
async def search_documents_secure(
    request: SecureSearchRequest,
    current_user: Dict[str, Any] = Security(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_role = current_user.get("role", ROLE_OPERATOR)
    allowed_clearances = current_user.get("clearances", get_allowed_clearances(user_role))

    results = await vector_service.search(
        session=db,
        query=request.query,
        top_k=request.top_k,
        plant_unit=request.plant_unit,
        doc_type=request.doc_type,
        similarity_threshold=request.similarity_threshold,
        allowed_clearances=allowed_clearances,
    )

    await audit_service.record_event(
        session=db,
        user_id=current_user.get("user_id", "engineer"),
        user_role=user_role,
        event_type="DOCUMENT_SEARCH_SECURE",
        details={
            "query": request.query,
            "allowed_clearances": allowed_clearances,
            "results_count": len(results),
        },
    )

    return SecureSearchResponse(
        query=request.query,
        user_role=user_role,
        effective_clearances=allowed_clearances,
        total_matches=len(results),
        results=results,
    )
