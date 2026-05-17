import re
from typing import Any, Dict, Optional


COMPARE_KEYWORDS = [
    "对比",
    "比较",
    "差异",
    "区别",
    "不同公司",
    "各家公司",
    "观点差异",
    "立场差异",
]

ANALYZE_KEYWORDS = [
    "分析",
    "总结",
    "梳理",
    "查看",
]


def _normalize_agenda_token(value: str) -> str:
    text = (value or "").strip()
    text = text.replace("．", ".").replace("。", ".")
    text = re.sub(r"\s+", "", text)
    return text


def _extract_agenda_item(message: str) -> str | None:
    text = message or ""

    patterns = [
        r"(?:agenda|议程)\s*#?\s*([0-9]+(?:\.[0-9]+)*)",
        r"\bAGENDA\s*([0-9]+(?:\.[0-9]+)*)\b",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return _normalize_agenda_token(match.group(1))

    return None


def _extract_meeting_list(message: str) -> str | None:
    text = message or ""

    patterns = [
        r"(TDoc_List_Meeting_[^\s，。；,;]+)",
        r"(TDoc_List_[^\s，。；,;]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()

    short_match = re.search(r"\b([A-Z]{1,5}\d?#\d{1,4})\b", text)
    if short_match:
        short_name = short_match.group(1)
        return f"TDoc_List_Meeting_{short_name}"

    return None


def _detect_task_type(message: str) -> str:
    text = (message or "").strip().lower()

    for keyword in COMPARE_KEYWORDS:
        if keyword.lower() in text:
            return "agenda_document_comparison"

    for keyword in ANALYZE_KEYWORDS:
        if keyword.lower() in text:
            return "agenda_batch_analysis"

    # 默认仍按分析任务处理
    return "agenda_batch_analysis"


def parse_user_intent(
    message: str,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    cleaned = (message or "").strip()
    if not cleaned:
        raise ValueError("消息不能为空。")

    context = context or {}

    meeting_list = _extract_meeting_list(cleaned) or context.get("meeting_list")
    agenda_item = _extract_agenda_item(cleaned) or context.get("agenda_item")

    if not meeting_list:
        raise ValueError(
            "未识别到会议清单名称；如果你是在当前会话继续追问，请先确保本会话里已经有一次明确的 meeting list 分析任务。"
        )

    if not agenda_item:
        raise ValueError("未识别到 agenda item，例如 AGENDA6.6。")

    task_type = _detect_task_type(cleaned)

    result = {
        "task_type": task_type,
        "meeting_list": meeting_list,
        "agenda_item": agenda_item,
    }

    if task_type == "agenda_document_comparison":
        result["comparison_focus"] = "company_position_diff"

    return result