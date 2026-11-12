from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from server.schemas.document import SearchResultItem

class TokenRequest(BaseModel):
    user_id: str
    role: Literal["OPERATOR", "PROCESS_ENGINEER", "PLANT_MANAGER", "SAFETY_AUDITOR"] = "OPERATOR"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    clearances: List[str]

class AuditLogEventRequest(BaseModel):
    event_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    task_id: Optional[UUID] = None

class AuditLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: Optional[UUID] = None
    user_id: str
    user_role: str
    event_type: str
    resource_id: Optional[str] = None
    details: Dict[str, Any]
    previous_hash: str
    current_hash: str
    timestamp: datetime

class AuditChainVerifyResponse(BaseModel):
    integrity_valid: bool
    total_records_verified: int
    genesis_hash: Optional[str] = None
    latest_hash: Optional[str] = None
    tampered_record_id: Optional[int] = None
    tampered_at_sequence: Optional[int] = None
    message: str

class SecureSearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=5, ge=1, le=20)
    plant_unit: Optional[str] = None
    doc_type: Optional[str] = None
    similarity_threshold: float = Field(default=0.3, ge=0.0, le=1.0)

class SecureSearchResponse(BaseModel):
    query: str
    user_role: str
    effective_clearances: List[str]
    total_matches: int
    results: List[SearchResultItem]

