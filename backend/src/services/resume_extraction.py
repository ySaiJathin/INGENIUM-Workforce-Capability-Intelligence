"""
PDF/DOCX text extraction (Task 4, research.md §1). Never lets a raw pypdf/python-docx exception
propagate — wraps every failure in ResumeExtractionError so the API layer can turn it into a clean
422 rather than an unhandled 500 (FR-004, FR-011).
"""

from __future__ import annotations

import io

PDF_MIME_TYPE = "application/pdf"
DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
SUPPORTED_MIME_TYPES = {PDF_MIME_TYPE, DOCX_MIME_TYPE}


class ResumeExtractionError(RuntimeError):
    """Raised when text cannot be extracted from an uploaded file, whatever the underlying cause
    (corrupted file, unsupported internal structure, a renamed non-PDF/DOCX file)."""


def extract_text(file_bytes: bytes, content_type: str) -> str:
    if content_type == PDF_MIME_TYPE:
        return _extract_pdf(file_bytes)
    if content_type == DOCX_MIME_TYPE:
        return _extract_docx(file_bytes)
    raise ResumeExtractionError(f"Unsupported content type for extraction: {content_type}")


def _extract_pdf(file_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(file_bytes))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as exc:  # pypdf raises various error types for malformed PDFs
        raise ResumeExtractionError(f"Could not read PDF: {exc}") from exc

    if not text.strip():
        raise ResumeExtractionError("PDF contained no extractable text")
    return text


def _extract_docx(file_bytes: bytes) -> str:
    try:
        import docx

        document = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join(p.text for p in document.paragraphs)
    except Exception as exc:  # python-docx raises various error types for malformed DOCX files
        raise ResumeExtractionError(f"Could not read DOCX: {exc}") from exc

    if not text.strip():
        raise ResumeExtractionError("DOCX contained no extractable text")
    return text
