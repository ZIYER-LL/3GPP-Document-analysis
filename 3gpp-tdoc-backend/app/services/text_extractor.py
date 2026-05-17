from pathlib import Path
import fitz
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
    if suffix == ".md":
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


def build_analysis_text(file_paths: list[Path], max_files: int = 5) -> str:
    """
    多文件时，把多个正文拼起来给模型
    """
    chunks = []

    for p in file_paths[:max_files]:
        try:
            content = extract_text(str(p))
        except Exception:
            continue

        if content and content.strip():
            chunks.append(f"\n\n===== 文件: {p.name} =====\n{content}")

    return "\n".join(chunks).strip()