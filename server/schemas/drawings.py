from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class DrawingEntityItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tag: str
    entity_type: str
    sub_type: Optional[str] = None
    page_number: int
    bbox: List[float]
    center: List[float]
    distance_px: Optional[float] = None
    raw_text: Optional[str] = None

class DrawingParseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    drawing_id: UUID
    drawing_number: str
    title: str
    plant_unit: Optional[str] = None
    total_entities: int
    equipment_count: int
    instruments_count: int
    valves_count: int
    lines_count: int
    entities: List[DrawingEntityItem]
    created_at: datetime

class TraceEquipmentRequest(BaseModel):
    drawing_id: UUID
    target_tag: str
    radius_px: float = Field(default=300.0, ge=50.0, le=2000.0)

class TraceEquipmentResponse(BaseModel):
    target_tag: str
    target_entity: Optional[DrawingEntityItem] = None
    connected_instruments: List[DrawingEntityItem]
    connected_valves: List[DrawingEntityItem]
    connected_lines: List[DrawingEntityItem]
    total_associated: int

class DrawingQARequest(BaseModel):
    drawing_id: UUID
    question: str
    target_tag: Optional[str] = None

class DrawingQAResponse(BaseModel):
    drawing_id: UUID
    question: str
    answer: str
    cited_tags: List[str]

