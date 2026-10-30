import os
import time
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from server.core.config import settings
from server.core.database import get_db
from server.models.document import Document, DocumentVersion, DocumentChunk
from server.schemas.document import (
    DocumentResponse,
    DocumentChunkResponse,
    DocumentSearchRequest,
    DocumentSearchResponse,
)
from server.ingestion.pdf_parser import parse_pdf_document
from server.retrieval.vector_store import OllamaEmbeddingService, VectorSearchService

router = APIRouter(prefix="/documents", tags=["documents"])
search_service = VectorSearchService()
embedding_service = OllamaEmbeddingService()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    doc_type: str = Form("SOP"),
    plant_unit: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    confidentiality_level: str = Form("RESTRICTED"),
    created_by: str = Form("engineer"),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")

    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    doc_title = title.strip() if title else file.filename

    try:
        file_hash, extracted_chunks, doc_metadata = parse_pdf_document(
            file_bytes=file_bytes,
            document_title=doc_title,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored_file_path = os.path.join(settings.UPLOAD_DIR, f"{file_hash}_{file.filename}")
    if not os.path.exists(stored_file_path):
        with open(stored_file_path, "wb") as f:
            f.write(file_bytes)

    existing_version_stmt = select(DocumentVersion).where(DocumentVersion.file_hash_sha256 == file_hash)
    existing_version = (await db.execute(existing_version_stmt)).scalar_one_or_none()

    if existing_version:
        doc_stmt = (
            select(Document)
            .options(selectinload(Document.versions))
            .where(Document.id == existing_version.document_id)
        )
        return (await db.execute(doc_stmt)).scalar_one()

    doc_record = Document(
        title=doc_title,
        doc_type=doc_type,
        plant_unit=plant_unit,
        department=department,
        confidentiality_level=confidentiality_level,
        created_by=created_by,
    )
    db.add(doc_record)
    await db.flush()

    initial_status = "INDEXED" if extracted_chunks else "EMPTY_TEXT"
    version_record = DocumentVersion(
        document_id=doc_record.id,
        version_number=1,
        file_name=file.filename,
        file_path=stored_file_path,
        file_size_bytes=file_size,
        file_hash_sha256=file_hash,
        mime_type="application/pdf",
        status=initial_status,
        metadata_=doc_metadata,
    )
    db.add(version_record)
    await db.flush()

    if extracted_chunks:
        chunk_texts = [item["content"] for item in extracted_chunks]
        try:
            embeddings = await embedding_service.generate_embeddings_batch(chunk_texts)
        except Exception:
            embeddings = [None] * len(chunk_texts)

        for idx, item in enumerate(extracted_chunks):
            chunk_record = DocumentChunk(
                version_id=version_record.id,
                chunk_index=item["chunk_index"],
                content=item["content"],
                embedding=embeddings[idx] if idx < len(embeddings) else None,
                page_number=item["page_number"],
                token_count=item["token_count"],
                metadata_=item["metadata"],
            )
            db.add(chunk_record)

    await db.commit()

    refreshed_stmt = (
        select(Document)
        .options(selectinload(Document.versions))
        .where(Document.id == doc_record.id)
    )
    return (await db.execute(refreshed_stmt)).scalar_one()

@router.post("/search", response_model=DocumentSearchResponse)
async def search_documents(
    request: DocumentSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    query_str = request.query.strip()
    if not query_str:
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    start_time = time.perf_counter()
    try:
        results = await search_service.search(
            session=db,
            query=query_str,
            top_k=request.top_k,
            plant_unit=request.plant_unit,
            doc_type=request.doc_type,
            similarity_threshold=request.similarity_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search execution failed: {str(e)}")

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return DocumentSearchResponse(
        query=query_str,
        total_results=len(results),
        results=results,
        execution_time_ms=round(elapsed_ms, 2),
    )

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    plant_unit: Optional[str] = Query(None),
    doc_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).options(selectinload(Document.versions)).order_by(Document.created_at.desc())
    if plant_unit:
        stmt = stmt.where(Document.plant_unit == plant_unit)
    if doc_type:
        stmt = stmt.where(Document.doc_type == doc_type)
    stmt = stmt.limit(limit)

    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Document)
        .options(selectinload(Document.versions))
        .where(Document.id == document_id)
    )
    doc = (await db.execute(stmt)).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.get("/{document_id}/chunks", response_model=List[DocumentChunkResponse])
async def get_document_chunks(
    document_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(DocumentChunk)
        .join(DocumentVersion, DocumentChunk.version_id == DocumentVersion.id)
        .where(DocumentVersion.document_id == document_id)
        .order_by(DocumentChunk.chunk_index.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
