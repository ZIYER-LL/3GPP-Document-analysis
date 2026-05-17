from app.services.model_client import (
    call_summary_model,
    call_company_comparison_model,
)

MAX_INPUT_TEXT_CHARS = 12000
MAX_COMPARISON_TEXT_CHARS = 18000


def _normalize_text(text: str, max_chars: int) -> str:
    text = text or ""
    if len(text) > max_chars:
        text = text[:max_chars]
    return text


def summarize_document(metadata: dict, text: str) -> str:
    safe_text = _normalize_text(text, MAX_INPUT_TEXT_CHARS)

    summary = call_summary_model(
        metadata=metadata or {},
        text=safe_text,
    )

    if not summary or not str(summary).strip():
        raise ValueError("模型服务返回空摘要")

    return str(summary).strip()


def summarize_text(text: str, metadata: dict) -> str:
    return summarize_document(metadata=metadata, text=text)


def generate_summary(text: str, metadata: dict) -> str:
    return summarize_document(metadata=metadata, text=text)


def summarize(text: str, metadata: dict) -> str:
    return summarize_document(metadata=metadata, text=text)


def synthesize_company_comparison(text: str, metadata: dict) -> str:
    safe_text = _normalize_text(text, MAX_COMPARISON_TEXT_CHARS)

    comparison = call_company_comparison_model(
        metadata=metadata or {},
        text=safe_text,
    )

    if not comparison or not str(comparison).strip():
        raise ValueError("模型服务返回空对比结果")

    return str(comparison).strip()