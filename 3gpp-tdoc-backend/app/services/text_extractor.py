from pathlib import Path
import fitz  # pymupdf
from docx import Document as DocxDocument


def extract_text(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return extract_pdf_text(file_path)
    if suffix == ".docx":
        return extract_docx_text(file_path)
    if suffix == ".txt":
        return Path(file_path).read_text(encoding="utf-8", errors="ignore")

    raise ValueError(f"暂不支持该文件类型: {suffix}")


def extract_pdf_text(file_path: str) -> str:
    texts = []
    with fitz.open(file_path) as doc:
        for page in doc:
            texts.append(page.get_text())
    return "\n".join(texts).strip()


def extract_docx_text(file_path: str) -> str:
    doc = DocxDocument(file_path)
    texts = [p.text for p in doc.paragraphs if p.text and p.text.strip()]
    return "\n".join(texts).strip()