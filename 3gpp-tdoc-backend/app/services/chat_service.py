from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.analysis_job import AnalysisJob
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession


def utc_now() -> datetime:
    return datetime.utcnow()


def build_session_title(content: str, max_len: int = 30) -> str:
    text = " ".join((content or "").strip().split())
    if not text:
        return "新会话"
    if len(text) <= max_len:
        return text
    return text[:max_len].rstrip() + "..."


def touch_session(session: ChatSession) -> None:
    now = utc_now()
    session.updated_at = now
    session.last_message_at = now


def get_latest_related_job_for_session(
    db: Session,
    session_id: int,
) -> Optional[AnalysisJob]:
    return (
        db.query(AnalysisJob)
        .filter(AnalysisJob.chat_session_id == session_id)
        .order_by(AnalysisJob.created_at.desc())
        .first()
    )


def get_latest_message_preview(db: Session, session_id: int) -> str:
    latest_message = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )
    if not latest_message:
        return ""
    text = (latest_message.content or "").strip()
    return text[:80]


def serialize_session(db: Session, session: ChatSession) -> dict:
    return {
        "id": session.id,
        "title": session.title,
        "latest_job_id": session.latest_job_id,
        "preview": get_latest_message_preview(db, session.id),
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
        "last_message_at": session.last_message_at.isoformat() if session.last_message_at else None,
    }


def serialize_message(message: ChatMessage) -> dict:
    return {
        "id": message.id,
        "session_id": message.session_id,
        "role": message.role,
        "content": message.content,
        "message_type": message.message_type,
        "related_job_id": message.related_job_id,
        "created_at": message.created_at.isoformat() if message.created_at else None,
    }


def build_non_task_reply(
    latest_job: Optional[AnalysisJob],
    user_content: str,
) -> str:
    text = (user_content or "").strip()

    if latest_job is None:
        return (
            "当前平台已经支持会话保存和任务执行，但目前普通聊天能力仍然比较有限。\n\n"
            "你可以继续这样发指令：\n"
            "- 请帮我分析 TDoc_List_Meeting_SA2#174 中 AGENDA3 的文稿\n"
            "- 分析 SA2#174 中 agenda 7 的文稿\n"
            "- 比较 agenda 3 和 agenda 7"
        )

    if latest_job.status in {"queued", "planning", "processing"}:
        return (
            f"当前会话最近的任务 #{latest_job.id} 还在处理中。\n"
            f"状态：{latest_job.status}\n"
            f"进度：{int(latest_job.progress or 0)}%\n\n"
            "你可以稍等任务完成，或者继续发新的明确分析指令。"
        )

    if latest_job.status == "failed":
        return (
            f"当前会话最近的任务 #{latest_job.id} 已失败。\n"
            f"错误信息：{latest_job.error_message or '未知错误'}\n\n"
            "你可以重新发起一个更明确的分析任务。"
        )

    if latest_job.status == "done":
        report = (latest_job.final_report_md or "").strip()

        if any(k in text for k in ["总结", "摘要", "重点", "结论", "概括", "主要内容"]):
            if report:
                preview = report[:1500]
                return f"我先基于当前会话最近完成的任务 #{latest_job.id} 给你一个结果预览：\n\n{preview}"

        if any(k in text.lower() for k in ["docx", "markdown", "下载", "导出"]):
            return (
                f"当前会话最近完成的任务是 #{latest_job.id}。\n"
                "你可以在右侧任务面板或任务详情页里下载 Markdown / DOCX 报告。"
            )

        return (
            f"当前会话最近完成的任务是 #{latest_job.id}。\n"
            "如果你想基于它继续深入，可以直接继续说：\n"
            "- 帮我总结重点提案\n"
            "- 这些文稿的共同主题是什么\n"
            "- 再帮我分析 agenda 7"
        )

    return "我已收到你的消息。"