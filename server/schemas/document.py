from datetime import datetime
from typing import Optional, List, Any, Dict
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, AliasChoices

class DocumentBase(BaseModel):
    title: str
    doc_type: str
    plant_unit: Optional[str] = None
    department: Optional[str] = None
    confidentiality_level: Optional[str] = "RESTRICTED"

class DocumentCreate(DocumentBase):
    created_by: str = "engineer"

class DocumentVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    document_id: UUID
    version_number: int
    file_name: str
    file_size_bytes: int
    file_hash_sha256: str
    mime_type: str
    status: str
    metadata_: Dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("metadata_", "metadata"),
        serialization_alias="metadata",
    )
    uploaded_at: datetime

class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: str
    created_at: datetime
    versions: List[DocumentVersionResponse] = []

class DocumentChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    version_id: UUID
    chunk_index: int
    content: str
    page_number: Optional[int] = None
    sheet_name: Optional[str] = None
    bounding_box: Optional[Any] = None
    token_count: Optional[int] = None
    metadata_: Dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("metadata_", "metadata"),
        serialization_alias="metadata",
    )
    created_at: datetime

class DocumentSearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=5, ge=1, le=20)
    plant_unit: Optional[str] = None
    doc_type: Optional[str] = None
    similarity_threshold: float = Field(default=0.3, ge=0.0, le=1.0)

class SearchResultItem(BaseModel):
    chunk_id: UUID
    document_id: UUID
    document_title: str
    doc_type: str
    plant_unit: Optional[str] = None
    page_number: Optional[int] = None
    chunk_index: int
    content: str
    similarity_score: float
    citation: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class DocumentSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
    execution_time_ms: float
