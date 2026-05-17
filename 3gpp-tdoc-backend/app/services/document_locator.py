from typing import Any, Iterable, Optional

from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.import_job import ImportJob


IMPORT_JOB_FILENAME_CANDIDATES = [
    "file_name",
    "filename",
    "source_file_name",
    "original_filename",
    "uploaded_file_name",
]


def get_first_attr(obj: Any, candidates: Iterable[str], default: Any = None) -> Any:
    for key in candidates:
        if hasattr(obj, key):
            value = getattr(obj, key)
            if value is not None:
                return value
    return default


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().lower()


def normalize_meeting_list_name(value: Any) -> str:
    text = normalize_text(value)
    if not text:
        return ""

    for suffix in [".xlsx", ".xls", ".csv", ".xlsm"]:
        if text.endswith(suffix):
            text = text[: -len(suffix)]
            break

    return text


def normalize_agenda(value: Any) -> str:
    if value is None:
        return ""

    text = str(value).strip().lower()
    text = text.replace("agenda", "").replace("议程", "").replace("#", "").strip()
    text = text.replace("．", ".").replace("。", ".")
    text = text.replace(" ", "")

    # 去掉首尾多余点
    text = text.strip(".")
    return text


def get_import_job_filename(import_job: ImportJob | None) -> str:
    if import_job is None:
        return ""

    raw_name = get_first_attr(import_job, IMPORT_JOB_FILENAME_CANDIDATES, "")
    return normalize_meeting_list_name(raw_name)


def find_import_job_by_meeting_list(
    db: Session,
    meeting_list: str,
) -> Optional[ImportJob]:
    target = normalize_meeting_list_name(meeting_list)
    if not target:
        return None

    jobs = db.query(ImportJob).all()
    for job in jobs:
        filename = get_import_job_filename(job)
        if not filename:
            continue

        if filename == target or target in filename or filename in target:
            return job

    return None


def _collect_real_agenda_values(documents: list[Document]) -> dict[str, str]:
    """
    返回：
    {
        规范化后的 agenda: 原始 agenda 显示值
    }
    优先 agenda_item，其次 agenda
    """
    result: dict[str, str] = {}

    for doc in documents:
        for raw in [doc.agenda_item, doc.agenda]:
            normalized = normalize_agenda(raw)
            if normalized and normalized not in result:
                result[normalized] = str(raw).strip()

    return result


def _resolve_target_agenda_from_documents(
    target_agenda: str,
    documents: list[Document],
) -> str:
    """
    基于该 meeting list 下真实文稿列表来校准用户输入的 agenda。
    优先精确匹配；如果没有，再尝试宽松匹配。
    """
    normalized_target = normalize_agenda(target_agenda)
    if not normalized_target:
        return ""

    real_agendas = _collect_real_agenda_values(documents)

    # 1. 精确匹配
    if normalized_target in real_agendas:
        return normalized_target

    # 2. 如果用户写了整数，而真实列表里只有 6.6 / 6.7，不要瞎匹配
    # 这里只做非常保守的前缀匹配：用户写 6.6，可匹配 6.6；不会退化成 6
    for agenda_key in real_agendas.keys():
        if agenda_key == normalized_target:
            return agenda_key

    # 3. 尝试去除末尾 .0 形式，例如 6.0 -> 6
    if normalized_target.endswith(".0"):
        shorter = normalized_target[:-2]
        if shorter in real_agendas:
            return shorter

    return normalized_target


def locate_documents_for_agenda(
    db: Session,
    meeting_list: str,
    agenda_item: str,
) -> list[Document]:
    import_job = find_import_job_by_meeting_list(db, meeting_list)
    if import_job is None:
        return []

    documents = (
        db.query(Document)
        .filter(Document.import_job_id == import_job.id)
        .all()
    )

    resolved_target_agenda = _resolve_target_agenda_from_documents(
        agenda_item,
        documents,
    )

    matched: list[Document] = []
    for doc in documents:
        agenda_candidates = [
            normalize_agenda(doc.agenda_item),
            normalize_agenda(doc.agenda),
        ]

        if resolved_target_agenda in agenda_candidates:
            matched.append(doc)

    matched.sort(
        key=lambda doc: (
            str(doc.title or ""),
            str(doc.tdoc_id or ""),
        )
    )
    return matched


def extract_source_file_id(documents: list[Document]) -> Optional[int]:
    if not documents:
        return None
    return documents[0].import_job_id