import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Text,
    DateTime,
    ForeignKey,
    Float,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from server.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    doc_type = Column(String(50), nullable=False)
    plant_unit = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    confidentiality_level = Column(String(50), default="RESTRICTED")
    created_by = Column(String(100), nullable=False, default="engineer")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False, default=1)
    file_name = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    file_hash_sha256 = Column(String(64), nullable=False, unique=True)
    mime_type = Column(String(100), nullable=False)
    status = Column(String(50), default="PROCESSING")
    metadata_ = Column("metadata", JSONB, default=dict)
    uploaded_at = Column(DateTime(timezone=True), default=utc_now)

    document = relationship("Document", back_populates="versions")
    chunks = relationship("DocumentChunk", back_populates="version", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=True)
    page_number = Column(Integer, nullable=True)
    sheet_name = Column(String(100), nullable=True)
    bounding_box = Column(JSONB, nullable=True)
    token_count = Column(Integer, nullable=True)
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    version = relationship("DocumentVersion", back_populates="chunks")
    tag_mappings = relationship("ChunkTagMapping", back_populates="chunk", cascade="all, delete-orphan")

class EquipmentTag(Base):
    __tablename__ = "equipment_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tag_number = Column(String(100), nullable=False, unique=True)
    equipment_name = Column(String(255), nullable=False)
    equipment_type = Column(String(100), nullable=False)
    plant_unit = Column(String(100), nullable=False)
    design_specs = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    chunk_mappings = relationship("ChunkTagMapping", back_populates="tag", cascade="all, delete-orphan")

class ChunkTagMapping(Base):
    __tablename__ = "chunk_tag_mapping"

    chunk_id = Column(UUID(as_uuid=True), ForeignKey("document_chunks.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("equipment_tags.id", ondelete="CASCADE"), primary_key=True)
    confidence = Column(Float, default=1.0)

    chunk = relationship("DocumentChunk", back_populates="tag_mappings")
    tag = relationship("EquipmentTag", back_populates="chunk_mappings")
