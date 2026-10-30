import hashlib
import re
from typing import List, Dict, Any, Tuple
import fitz

def compute_sha256(file_bytes: bytes) -> str:
    hasher = hashlib.sha256()
    hasher.update(file_bytes)
    return hasher.hexdigest()

def estimate_tokens(text: str) -> int:
    return max(1, len(text.split()))

def split_text_into_chunks(
    text: str,
    max_chunk_chars: int = 2000,
    overlap_chars: int = 300,
) -> List[str]:
    if len(text) <= max_chunk_chars:
        return [text] if text.strip() else []

    paragraphs = re.split(r"(\n\s*\n)", text)
    chunks: List[str] = []
    current_chunk: List[str] = []
    current_length = 0

    for segment in paragraphs:
        segment_len = len(segment)
        if current_length + segment_len > max_chunk_chars and current_chunk:
            combined = "".join(current_chunk).strip()
            if combined:
                chunks.append(combined)
            overlap_text = "".join(current_chunk)[-overlap_chars:]
            current_chunk = [overlap_text, segment]
            current_length = len(overlap_text) + segment_len
        else:
            current_chunk.append(segment)
            current_length += segment_len

    if current_chunk:
        remaining = "".join(current_chunk).strip()
        if remaining:
            chunks.append(remaining)

    return chunks

def parse_pdf_document(
    file_bytes: bytes,
    document_title: str,
    max_chunk_chars: int = 2000,
    overlap_chars: int = 300,
) -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
    file_hash = compute_sha256(file_bytes)
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    try:
        total_pages = len(doc)
        extracted_chunks: List[Dict[str, Any]] = []
        global_chunk_index = 0

        for page_idx in range(total_pages):
            page = doc.load_page(page_idx)
            page_num = page_idx + 1
            raw_text = page.get_text("text")

            cleaned_text = re.sub(r"\r\n|\r", "\n", raw_text)
            cleaned_text = re.sub(r"[ \t]+", " ", cleaned_text)
            cleaned_text = cleaned_text.strip()

            if not cleaned_text:
                continue

            page_chunks = split_text_into_chunks(
                cleaned_text,
                max_chunk_chars=max_chunk_chars,
                overlap_chars=overlap_chars,
            )

            for chunk_text in page_chunks:
                if not chunk_text.strip():
                    continue

                contextual_content = f"[Document: {document_title} | Page: {page_num}]\n{chunk_text}"
                token_count = estimate_tokens(contextual_content)

                extracted_chunks.append({
                    "chunk_index": global_chunk_index,
                    "content": contextual_content,
                    "raw_text": chunk_text,
                    "page_number": page_num,
                    "token_count": token_count,
                    "metadata": {
                        "page_number": page_num,
                        "total_pages": total_pages,
                        "char_length": len(chunk_text),
                    },
                })
                global_chunk_index += 1

        doc_metadata = {
            "total_pages": total_pages,
            "total_chunks": len(extracted_chunks),
            "pdf_metadata": doc.metadata or {},
        }
        return file_hash, extracted_chunks, doc_metadata
    finally:
        doc.close()
