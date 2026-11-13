from typing import List, Optional
from uuid import UUID
import httpx
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from server.core.config import settings
from server.models.document import Document, DocumentVersion, DocumentChunk
from server.schemas.document import SearchResultItem

class OllamaEmbeddingService:
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.EMBEDDING_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate_embedding(self, text: str) -> List[float]:
        url = f"{self.base_url}/api/embeddings"
        payload = {"model": self.model, "prompt": text}
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["embedding"]

    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        embeddings: List[List[float]] = []
        for text in texts:
            emb = await self.generate_embedding(text)
            embeddings.append(emb)
        return embeddings

class VectorSearchService:
    def __init__(self, embedding_service: Optional[OllamaEmbeddingService] = None):
        self.embedding_service = embedding_service or OllamaEmbeddingService()

    async def search(
        self,
        session: AsyncSession,
        query: str,
        top_k: int = 5,
        plant_unit: Optional[str] = None,
        doc_type: Optional[str] = None,
        similarity_threshold: float = 0.3,
        allowed_clearances: Optional[List[str]] = None,
        document_id: Optional[UUID] = None,
        document_title: Optional[str] = None,
    ) -> List[SearchResultItem]:
        query_text = query.strip()
        if not query_text:
            return []

        effective_threshold = similarity_threshold
        if document_id or document_title:
            effective_threshold = 0.01

        filters = [DocumentChunk.embedding.is_not(None)]
        if document_id:
            filters.append(Document.id == document_id)
        elif document_title:
            filters.append(Document.title.ilike(f"%{document_title.strip()}%"))

        if plant_unit and plant_unit.upper() != "ALL":
            filters.append(Document.plant_unit == plant_unit)
        if doc_type and doc_type.upper() != "ALL":
            filters.append(Document.doc_type == doc_type)
        if allowed_clearances:
            filters.append(Document.confidentiality_level.in_(allowed_clearances))

        results: List[SearchResultItem] = []
        try:
            query_vector = await self.embedding_service.generate_embedding(query_text)
            distance_col = DocumentChunk.embedding.cosine_distance(query_vector).label("distance")

            stmt = (
                select(
                    DocumentChunk,
                    DocumentVersion,
                    Document,
                    distance_col,
                )
                .join(DocumentVersion, DocumentChunk.version_id == DocumentVersion.id)
                .join(Document, DocumentVersion.document_id == Document.id)
                .where(and_(*filters))
                .order_by(distance_col.asc())
                .limit(top_k * 2)
            )

            result = await session.execute(stmt)
            rows = result.all()

            for chunk, version, doc, distance in rows:
                dist_val = float(distance) if distance is not None else 1.0
                similarity = max(0.0, 1.0 - dist_val)

                if similarity < effective_threshold:
                    continue

                page_str = f"Page {chunk.page_number}" if chunk.page_number else "N/A"
                citation = f"{doc.title} ({page_str})"

                results.append(
                    SearchResultItem(
                        chunk_id=chunk.id,
                        document_id=doc.id,
                        document_title=doc.title,
                        doc_type=doc.doc_type,
                        plant_unit=doc.plant_unit,
                        page_number=chunk.page_number,
                        chunk_index=chunk.chunk_index,
                        content=chunk.content,
                        similarity_score=round(similarity, 4),
                        citation=citation,
                        metadata=chunk.metadata_ or {},
                    )
                )

                if len(results) >= top_k:
                    break
        except Exception:
            pass

        if (document_id or document_title) and len(results) < top_k:
            fallback_filters = []
            if document_id:
                fallback_filters.append(Document.id == document_id)
            elif document_title:
                fallback_filters.append(Document.title.ilike(f"%{document_title.strip()}%"))
            if allowed_clearances:
                fallback_filters.append(Document.confidentiality_level.in_(allowed_clearances))

            fallback_stmt = (
                select(DocumentChunk, DocumentVersion, Document)
                .join(DocumentVersion, DocumentChunk.version_id == DocumentVersion.id)
                .join(Document, DocumentVersion.document_id == Document.id)
                .where(and_(*fallback_filters))
                .order_by(DocumentChunk.chunk_index.asc())
                .limit(top_k)
            )
            fallback_rows = (await session.execute(fallback_stmt)).all()
            existing_chunk_ids = {r.chunk_id for r in results}
            for chunk, version, doc in fallback_rows:
                if chunk.id not in existing_chunk_ids:
                    page_str = f"Page {chunk.page_number}" if chunk.page_number else "N/A"
                    citation = f"{doc.title} ({page_str})"
                    results.append(
                        SearchResultItem(
                            chunk_id=chunk.id,
                            document_id=doc.id,
                            document_title=doc.title,
                            doc_type=doc.doc_type,
                            plant_unit=doc.plant_unit,
                            page_number=chunk.page_number,
                            chunk_index=chunk.chunk_index,
                            content=chunk.content,
                            similarity_score=1.0,
                            citation=citation,
                            metadata=chunk.metadata_ or {},
                        )
                    )
                    if len(results) >= top_k:
                        break

        return results
