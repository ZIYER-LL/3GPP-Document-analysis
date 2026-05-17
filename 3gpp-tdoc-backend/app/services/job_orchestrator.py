import importlib
import json
import time
import traceback
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from urllib.request import urlretrieve

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.analysis_job import AnalysisJob
from app.models.analysis_job_item import AnalysisJobItem
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.models.document import Document
from app.services.document_locator import extract_source_file_id
from app.services.report_builder import (
    ensure_job_report_dir,
    build_final_report_markdown,
    build_item_report_markdown,
    write_docx_report,
    write_markdown_report,
)

BACKEND_ROOT = Path(__file__).resolve().parents[2]
DOWNLOAD_ROOT = BACKEND_ROOT / "downloads" / "tdocs"

MAX_SUMMARY_INPUT_CHARS = 12000
MAX_COMPARISON_INPUT_CHARS = 8000
SUMMARY_RETRY_TIMES = 2
SUMMARY_RETRY_SLEEP_SECONDS = 1.5


def utc_now_iso() -> str:
    return datetime.utcnow().isoformat()


def safe_json_loads(value: Optional[str], default: Any):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def safe_json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def append_job_log(job: AnalysisJob, message: str, level: str = "info") -> None:
    logs = safe_json_loads(job.logs_json, [])
    logs.append(
        {
            "message": message,
            "level": level,
            "created_at": utc_now_iso(),
        }
    )
    job.logs_json = safe_json_dumps(logs)


def create_job_and_items(
    db: Session,
    user_prompt: str,
    parsed_task: Dict[str, Any],
    documents: List[Document],
    chat_session_id: int | None = None,
    trigger_message_id: int | None = None,
) -> AnalysisJob:
    job = AnalysisJob(
        user_prompt=user_prompt,
        task_type=parsed_task["task_type"],
        source_file_id=extract_source_file_id(documents),
        source_meeting_name=parsed_task.get("meeting_list"),
        target_agenda_item=str(parsed_task.get("agenda_item")),
        chat_session_id=chat_session_id,
        trigger_message_id=trigger_message_id,
        status="queued",
        progress=0,
        total_items=len(documents),
        completed_items=0,
        failed_items=0,
        parsed_task_json=safe_json_dumps(parsed_task),
        logs_json="[]",
    )
    db.add(job)
    db.flush()

    for index, doc in enumerate(documents, start=1):
        item = AnalysisJobItem(
            job_id=job.id,
            document_id=doc.id,
            tdoc_id=doc.tdoc_id,
            title=doc.title or f"Document {index}",
            agenda_item=doc.agenda_item or doc.agenda,
            order_index=index,
            status="queued",
            download_status="pending",
            extract_status="pending",
            summary_status="pending",
        )
        db.add(item)

    append_job_log(job, f"已创建任务，待处理文稿数：{len(documents)}")
    db.commit()
    db.refresh(job)
    return job


def _load_module(module_name: str):
    try:
        return importlib.import_module(module_name)
    except Exception:
        return None


def _call_module_function(module: Any, candidate_names: list[str], *args, **kwargs):
    if module is None:
        return None

    for name in candidate_names:
        fn = getattr(module, name, None)
        if not callable(fn):
            continue

        attempts = [
            lambda: fn(*args, **kwargs),
            lambda: fn(*args),
        ]

        for attempt in attempts:
            try:
                return attempt()
            except TypeError:
                continue
            except Exception:
                raise

    return None


def _get_filename_from_url(url: str, fallback_name: str) -> str:
    parsed = urlparse(url)
    name = Path(parsed.path).name
    if name:
        return name
    return fallback_name


def _download_file_fallback(url: str, filename: str) -> str:
    DOWNLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    local_path = DOWNLOAD_ROOT / filename

    if local_path.exists():
        return str(local_path)

    urlretrieve(url, str(local_path))
    return str(local_path)


def download_document(document: Document) -> Optional[str]:
    url = document.tdoc_url
    if not url:
        return None

    downloader_module = _load_module("app.services.downloader")

    fallback_name = document.tdoc_id or "document"
    filename = _get_filename_from_url(url, fallback_name)

    result = _call_module_function(
        downloader_module,
        [
            "download_document_by_url",
            "download_file",
            "download_document",
        ],
        url,
    )
    if isinstance(result, str) and result:
        return result

    return _download_file_fallback(url, filename)


def _extract_zip_recursive(path: Path) -> list[Path]:
    if not path.exists():
        return []

    if path.suffix.lower() != ".zip":
        return [path]

    extract_dir = path.parent / f"{path.stem}_extracted"
    extract_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(path, "r") as zf:
        zf.extractall(extract_dir)

    results: list[Path] = []

    for child in extract_dir.rglob("*"):
        if child.is_file():
            if child.suffix.lower() == ".zip":
                results.extend(_extract_zip_recursive(child))
            else:
                results.append(child)

    return results


def resolve_analysis_files(local_path: str | None) -> list[str]:
    if not local_path:
        return []

    archive_module = _load_module("app.services.archive_handler")
    result = _call_module_function(
        archive_module,
        [
            "resolve_analysis_files",
            "extract_archive",
            "handle_archive",
        ],
        local_path,
    )

    if isinstance(result, list):
        return [str(x) for x in result if x]

    path = Path(local_path)
    files = _extract_zip_recursive(path)
    return [str(p) for p in files]


def extract_text_from_path(path: str) -> str:
    extractor_module = _load_module("app.services.text_extractor")

    result = _call_module_function(
        extractor_module,
        [
            "extract_text",
            "extract_text_from_file",
            "extract",
        ],
        path,
    )

    if isinstance(result, str) and result.strip():
        return result.strip()

    p = Path(path)
    if p.suffix.lower() in {".txt", ".md", ".log"}:
        return p.read_text(encoding="utf-8", errors="ignore").strip()

    return ""


def summarize_text(text: str, metadata: dict) -> str:
    llm_module = _load_module("app.services.llm_summary")

    if llm_module is not None:
        for fn_name in [
            "summarize_document",
            "summarize_text",
            "generate_summary",
            "summarize",
        ]:
            fn = getattr(llm_module, fn_name, None)
            if not callable(fn):
                continue

            try:
                result = fn(text=text, metadata=metadata)
            except TypeError:
                try:
                    result = fn(text, metadata)
                except TypeError:
                    result = fn(text)

            if isinstance(result, dict):
                for key in [
                    "summary",
                    "summary_text",
                    "content",
                    "text",
                    "result",
                ]:
                    if result.get(key):
                        return str(result[key]).strip()
            elif isinstance(result, str) and result.strip():
                return result.strip()

    preview = text[:1200].strip()
    if not preview:
        return "未能提取到足够正文，当前仅能基于标题或元数据进行轻量分析。"

    title = metadata.get("title") or "未知标题"
    tdoc_id = metadata.get("tdoc_id") or "-"
    agenda_item = metadata.get("agenda_item") or "-"

    return (
        f"文稿标题：{title}\n"
        f"TDoc ID：{tdoc_id}\n"
        f"Agenda Item：{agenda_item}\n\n"
        f"正文预览：\n{preview}"
    )


def build_analysis_text(
    document: Document,
    local_path: Optional[str],
) -> tuple[str, list[str]]:
    extracted_files: list[str] = []

    if local_path:
        extracted_files = resolve_analysis_files(local_path)
        if not extracted_files and Path(local_path).exists():
            extracted_files = [local_path]

    parts: list[str] = []

    if extracted_files:
        for file_path in extracted_files:
            try:
                text = extract_text_from_path(file_path)
                if text:
                    parts.append(text)
            except Exception:
                # 抽取单个文件失败时忽略，继续尝试其他文件
                continue

    if not parts and document.abstract:
        parts.append(document.abstract.strip())

    if not parts:
        meta_lines = [
            f"标题：{document.title or '-'}",
            f"TDoc ID：{document.tdoc_id or '-'}",
            f"Agenda：{document.agenda_item or document.agenda or '-'}",
            f"来源：{document.source or '-'}",
            f"联系人：{document.contact or '-'}",
            f"Spec：{document.spec or '-'}",
            f"版本：{document.version or '-'}",
        ]
        parts.append("\n".join(meta_lines))

    return "\n\n".join(parts).strip(), extracted_files


def _write_item_reports(
    item: AnalysisJobItem,
    report_dir: Path,
    summary_text: str,
) -> None:
    item_md_content = build_item_report_markdown(
        title=item.title,
        tdoc_id=item.tdoc_id,
        agenda_item=item.agenda_item,
        summary_text=summary_text,
    )

    item_md_path = report_dir / f"item_{item.order_index:03d}.md"
    item.report_md_path = write_markdown_report(item_md_path, item_md_content)

    item_docx_path = report_dir / f"item_{item.order_index:03d}.docx"
    item.report_docx_path = write_docx_report(
        item_docx_path,
        title=f"单篇文稿分析报告 - {item.title}",
        paragraphs=[
            f"TDoc ID: {item.tdoc_id or '-'}",
            f"Agenda Item: {item.agenda_item or '-'}",
            "",
            summary_text,
        ],
    )


def _append_success_section(
    successful_sections: list[dict],
    item: AnalysisJobItem,
    document: Document | None = None,
) -> None:
    successful_sections.append(
        {
            "title": item.title,
            "tdoc_id": item.tdoc_id,
            "status": item.status,
            "summary_text": item.summary_text,
            "source": document.source if document else None,
            "contact": document.contact if document else None,
            "spec": document.spec if document else None,
            "version": document.version if document else None,
            "release": document.release if document else None,
            "type_raw": document.type_raw if document else None,
            "for_raw": document.for_raw if document else None,
            "agenda_item": document.agenda_item if document else item.agenda_item,
        }
    )


def _can_reuse_document_summary(document: Document) -> bool:
    return bool(
        document.summary_status == "done"
        and document.summary_text
        and str(document.summary_text).strip()
    )


def _truncate_for_summary(
    text: str,
    max_chars: int = MAX_SUMMARY_INPUT_CHARS,
) -> tuple[str, bool]:
    text = text or ""
    if len(text) <= max_chars:
        return text, False
    return text[:max_chars], True


def _build_lightweight_summary(
    document: Document,
    item: AnalysisJobItem,
    analysis_text: str,
) -> str:
    preview = (analysis_text or "").strip()[:1200]
    if not preview:
        preview = (document.abstract or "").strip()

    return (
        f"标题：{document.title or item.title}\n"
        f"TDoc ID：{document.tdoc_id or item.tdoc_id or '-'}\n"
        f"Agenda：{document.agenda_item or document.agenda or item.agenda_item or '-'}\n"
        f"来源：{document.source or '-'}\n"
        f"联系人：{document.contact or '-'}\n"
        f"Spec：{document.spec or '-'}\n"
        f"Version：{document.version or '-'}\n\n"
        f"轻量摘要：\n{preview or '暂无可用正文，已退化为元数据摘要。'}"
    )


def _run_summary_with_retry(
    job: AnalysisJob,
    item: AnalysisJobItem,
    index: int,
    total: int,
    text: str,
    metadata: dict,
) -> str:
    last_error = None

    for attempt in range(1, SUMMARY_RETRY_TIMES + 1):
        append_job_log(
            job,
            f"第 {index}/{total} 篇进入摘要阶段（第 {attempt} 次尝试）：title={item.title}，input_length={len(text or '')}",
            "info",
        )
        try:
            summary = summarize_text(text, metadata)
            if summary and str(summary).strip():
                append_job_log(
                    job,
                    f"第 {index}/{total} 篇摘要成功：title={item.title}，summary_length={len(summary)}",
                    "info",
                )
                return summary
            raise RuntimeError("模型服务返回空摘要")
        except Exception as exc:
            last_error = exc
            append_job_log(
                job,
                f"第 {index}/{total} 篇摘要第 {attempt} 次失败：{exc}",
                "warning",
            )
            if attempt < SUMMARY_RETRY_TIMES:
                time.sleep(SUMMARY_RETRY_SLEEP_SECONDS)

    raise RuntimeError(f"摘要失败，最后一次错误：{last_error}")


def synthesize_company_comparison(
    item_sections: list[dict],
    meeting_list: str,
    agenda_item: str,
) -> str:
    """
    针对同一 Agenda 下多篇文稿，重点比较不同公司/来源之间的观点差异。
    """
    if not item_sections:
        return "暂无可用于比较的文稿。"

    grouped_by_source: dict[str, list[dict]] = {}
    for item in item_sections:
        source = (item.get("source") or item.get("contact") or "未知来源").strip()
        grouped_by_source.setdefault(source, []).append(item)

    if len(grouped_by_source) <= 1:
        only_source = next(iter(grouped_by_source.keys()), "未知来源")
        return (
            "## 公司观点对比分析\n\n"
            f"当前 Agenda 下的文稿主要只来自一个来源：{only_source}。\n"
            "因此暂时不具备明显的跨公司观点差异比较条件。"
        )

    llm_module = _load_module("app.services.llm_summary")

    comparison_lines = [
        f"Meeting List: {meeting_list}",
        f"Agenda Item: {agenda_item}",
        "任务目标：比较不同公司/来源在同一 Agenda 下的观点差异、共识与潜在冲突。",
        "",
        "按来源分组的文稿摘要如下：",
        "",
    ]

    for source, docs in grouped_by_source.items():
        comparison_lines.append(f"来源/公司：{source}")
        for idx, doc in enumerate(docs, start=1):
            comparison_lines.extend(
                [
                    f"  文稿 {idx}",
                    f"  标题: {doc.get('title') or '-'}",
                    f"  TDoc ID: {doc.get('tdoc_id') or '-'}",
                    f"  Spec: {doc.get('spec') or '-'}",
                    f"  Version: {doc.get('version') or '-'}",
                    f"  Summary: {(doc.get('summary_text') or '暂无摘要')[:1000]}",
                    "",
                ]
            )

    comparison_input = "\n".join(comparison_lines)
    comparison_input, was_truncated = _truncate_for_summary(
        comparison_input,
        MAX_COMPARISON_INPUT_CHARS,
    )

    if llm_module is not None:
        for fn_name in [
            "synthesize_company_comparison",
            "compare_documents",
            "compare_document_summaries",
            "synthesize_agenda_comparison",
            "synthesize_agenda_report",
        ]:
            fn = getattr(llm_module, fn_name, None)
            if not callable(fn):
                continue

            try:
                result = fn(
                    text=comparison_input,
                    metadata={
                        "meeting_list": meeting_list,
                        "agenda_item": agenda_item,
                        "comparison_focus": "company_position_diff",
                        "source_count": len(grouped_by_source),
                        "document_count": len(item_sections),
                        "input_truncated": was_truncated,
                    },
                )
            except TypeError:
                try:
                    result = fn(comparison_input)
                except TypeError:
                    continue

            if isinstance(result, dict):
                for key in [
                    "summary",
                    "summary_text",
                    "content",
                    "text",
                    "result",
                    "comparison",
                ]:
                    if result.get(key):
                        return str(result[key]).strip()
            elif isinstance(result, str) and result.strip():
                return result.strip()

    lines = [
        "## 公司观点对比分析",
        "",
        f"- Meeting List：{meeting_list}",
        f"- Agenda Item：{agenda_item}",
        f"- 参与来源数量：{len(grouped_by_source)}",
        "",
        "### 各来源文稿分布",
    ]

    for source, docs in grouped_by_source.items():
        lines.append(f"- {source}：{len(docs)} 篇文稿")

    lines.extend(
        [
            "",
            "### 初步对比结论",
            "- 当前版本未命中多文稿对比模型时，使用规则型兜底输出。",
            "- 建议重点比较不同来源文稿摘要中对问题定义、方案路径、优先级排序的差异。",
            "- 如果某些来源提出的是补充性方案，则属于互补关系；如果对同一问题给出不同结论，则可能存在潜在冲突。",
            "",
            "### 各来源文稿摘要",
        ]
    )

    for source, docs in grouped_by_source.items():
        lines.append(f"#### {source}")
        for doc in docs:
            lines.extend(
                [
                    f"- {doc.get('title') or '-'} ({doc.get('tdoc_id') or '-'})",
                    f"  摘要：{(doc.get('summary_text') or '暂无摘要')[:300]}",
                ]
            )
        lines.append("")

    return "\n".join(lines)


def _append_chat_result_message(db: Session, job: AnalysisJob) -> None:
    if not job.chat_session_id:
        return

    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == job.chat_session_id)
        .first()
    )
    if not session:
        return

    if job.status == "done":
        content = (
            f"任务 #{job.id} 已完成。\n"
            f"Meeting List：{job.source_meeting_name or '-'}\n"
            f"Agenda：{job.target_agenda_item or '-'}\n"
            f"成功完成：{job.completed_items}\n"
            f"失败数量：{job.failed_items}"
        )
        message_type = "task_result"
    else:
        content = (
            f"任务 #{job.id} 执行失败。\n"
            f"错误信息：{job.error_message or '未知错误'}"
        )
        message_type = "error"

    db.add(
        ChatMessage(
            session_id=session.id,
            role="assistant",
            content=content,
            message_type=message_type,
            related_job_id=job.id,
        )
    )
    session.latest_job_id = job.id
    session.updated_at = datetime.utcnow()
    session.last_message_at = datetime.utcnow()


def process_job(job_id: int) -> None:
    db = SessionLocal()
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            return

        job.status = "planning"
        job.progress = 5
        append_job_log(job, "任务已进入规划阶段。")
        db.commit()

        job.status = "processing"
        job.progress = 10
        append_job_log(job, f"开始逐篇处理，共 {job.total_items} 篇文稿。")
        db.commit()

        report_dir = ensure_job_report_dir(job.id)
        successful_sections: list[dict] = []

        total = max(job.total_items, 1)

        for index, item in enumerate(job.items, start=1):
            item.status = "processing"
            append_job_log(job, f"正在处理第 {index}/{total} 篇：{item.title}")
            db.commit()

            document = None
            if item.document_id is not None:
                document = db.query(Document).filter(Document.id == item.document_id).first()

            if document is None:
                item.status = "failed"
                item.download_status = "failed"
                item.extract_status = "failed"
                item.summary_status = "failed"
                item.error_message = "未找到对应文稿记录。"
                job.failed_items += 1
                append_job_log(
                    job,
                    f"第 {index} 篇失败：未找到 document_id={item.document_id}",
                    "error",
                )
                job.progress = 10 + (index / total) * 80
                db.commit()
                continue

            try:
                # 优先复用已有摘要
                if _can_reuse_document_summary(document):
                    cached_summary = str(document.summary_text).strip()

                    item.summary_text = cached_summary
                    item.summary_status = "done"
                    item.download_status = "skipped"
                    item.extract_status = "skipped"
                    item.status = "done"
                    item.error_message = None
                    item.extracted_files_json = safe_json_dumps([])
                    item.local_file_path = None

                    _write_item_reports(item, report_dir, cached_summary)

                    job.completed_items += 1
                    _append_success_section(successful_sections, item, document)
                    append_job_log(
                        job,
                        f"第 {index}/{total} 篇直接复用已有摘要：{item.title}",
                    )

                    job.progress = 10 + (index / total) * 80
                    db.commit()
                    continue

                item.download_status = "processing"
                db.commit()

                local_path = download_document(document)
                item.local_file_path = local_path
                item.download_status = "done" if local_path else "skipped"
                db.commit()

                item.extract_status = "processing"
                db.commit()

                analysis_text, extracted_files = build_analysis_text(document, local_path)
                item.extracted_files_json = safe_json_dumps(extracted_files)
                item.extract_status = "done" if analysis_text else "skipped"
                db.commit()

                item.summary_status = "processing"
                db.commit()

                metadata = {
                    "title": document.title or item.title,
                    "tdoc_id": document.tdoc_id or item.tdoc_id,
                    "agenda_item": document.agenda_item or document.agenda or item.agenda_item,
                    "source": document.source,
                    "contact": document.contact,
                    "spec": document.spec,
                    "version": document.version,
                    "release": document.release,
                    "type_raw": document.type_raw,
                    "for_raw": document.for_raw,
                }

                original_len = len(analysis_text or "")
                analysis_text, was_truncated = _truncate_for_summary(
                    analysis_text,
                    MAX_SUMMARY_INPUT_CHARS,
                )
                if was_truncated:
                    append_job_log(
                        job,
                        f"第 {index}/{total} 篇正文过长，已截断后送入摘要模型（原始长度 {original_len} 字符，截断到 {MAX_SUMMARY_INPUT_CHARS} 字符）。",
                        "warning",
                    )

                try:
                    summary_text = _run_summary_with_retry(
                        job=job,
                        item=item,
                        index=index,
                        total=total,
                        text=analysis_text,
                        metadata=metadata,
                    )
                except Exception as summary_exc:
                    append_job_log(
                        job,
                        f"第 {index}/{total} 篇摘要模型失败，改为生成轻量摘要：{summary_exc}",
                        "warning",
                    )
                    summary_text = _build_lightweight_summary(
                        document=document,
                        item=item,
                        analysis_text=analysis_text,
                    )

                item.summary_text = summary_text
                item.summary_status = "done"
                item.status = "done"
                item.error_message = None

                document.summary_text = summary_text
                document.summary_status = "done"
                document.summary_error = None
                document.summary_updated_at = datetime.utcnow()

                _write_item_reports(item, report_dir, summary_text)

                job.completed_items += 1
                _append_success_section(successful_sections, item, document)
                append_job_log(job, f"第 {index}/{total} 篇完成：{item.title}")

            except Exception as exc:
                item.status = "failed"
                item.download_status = (
                    item.download_status if item.download_status == "done" else "failed"
                )
                item.extract_status = (
                    item.extract_status if item.extract_status == "done" else "failed"
                )
                item.summary_status = "failed"
                item.error_message = str(exc)

                if document is not None:
                    document.summary_status = "failed"
                    document.summary_error = str(exc)
                    document.summary_updated_at = datetime.utcnow()

                job.failed_items += 1
                append_job_log(
                    job,
                    f"第 {index}/{total} 篇失败：{item.title}，原因：{exc}",
                    "error",
                )
            finally:
                job.progress = 10 + (index / total) * 80
                db.commit()

        base_final_md = build_final_report_markdown(
            meeting_list=job.source_meeting_name or "-",
            agenda_item=job.target_agenda_item or "-",
            total_items=job.total_items,
            completed_items=job.completed_items,
            failed_items=job.failed_items,
            item_sections=successful_sections,
        )

        if job.task_type == "agenda_document_comparison":
            comparison_md = synthesize_company_comparison(
                item_sections=successful_sections,
                meeting_list=job.source_meeting_name or "-",
                agenda_item=job.target_agenda_item or "-",
            )
            final_md = f"{comparison_md}\n\n---\n\n{base_final_md}"
        else:
            final_md = base_final_md

        final_md_path = report_dir / "final_report.md"
        job.final_report_md = final_md
        job.final_report_md_path = write_markdown_report(final_md_path, final_md)

        final_docx_path = report_dir / "final_report.docx"
        job.final_report_docx_path = write_docx_report(
            final_docx_path,
            title=f"Agenda 汇总报告 - {job.source_meeting_name or '-'} / Agenda {job.target_agenda_item or '-'}",
            paragraphs=[
                f"Meeting List: {job.source_meeting_name or '-'}",
                f"Agenda Item: {job.target_agenda_item or '-'}",
                f"总文稿数: {job.total_items}",
                f"成功完成: {job.completed_items}",
                f"失败数量: {job.failed_items}",
                "",
                final_md,
            ],
        )

        if job.completed_items > 0:
            job.status = "done"
            append_job_log(job, "任务已完成。")
        else:
            job.status = "failed"
            job.error_message = "所有文稿处理均失败。"
            append_job_log(job, "任务失败：所有文稿处理均失败。", "error")

        job.progress = 100

        _append_chat_result_message(db, job)
        db.commit()

    except Exception as exc:
        db.rollback()
        try:
            job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = f"{exc}\n\n{traceback.format_exc()}"
                append_job_log(job, f"任务级异常：{exc}", "error")
                _append_chat_result_message(db, job)
                db.commit()
        except Exception:
            db.rollback()
    finally:
        db.close()