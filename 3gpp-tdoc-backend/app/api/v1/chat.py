from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.schemas.chat import CreateChatMessageRequest, CreateChatSessionRequest
from app.services.agent_parser import parse_user_intent
from app.services.chat_service import (
    build_non_task_reply,
    build_session_title,
    get_latest_related_job_for_session,
    serialize_message,
    serialize_session,
    touch_session,
)
from app.services.document_locator import locate_documents_for_agenda
from app.services.job_orchestrator import create_job_and_items, process_job

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/sessions")
def list_chat_sessions(db: Session = Depends(get_db)):
    sessions = (
        db.query(ChatSession)
        .order_by(ChatSession.last_message_at.desc(), ChatSession.updated_at.desc())
        .all()
    )
    return [serialize_session(db, session) for session in sessions]


@router.post("/sessions")
def create_chat_session(
    payload: CreateChatSessionRequest,
    db: Session = Depends(get_db),
):
    title = (payload.title or "").strip() or "新会话"
    session = ChatSession(
        title=title,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        last_message_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"session": serialize_session(db, session)}


@router.get("/sessions/{session_id}/messages")
def get_chat_messages(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在。")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [serialize_message(message) for message in messages]


@router.post("/sessions/{session_id}/messages")
def send_chat_message(
    session_id: int,
    payload: CreateChatMessageRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在。")

    content = (payload.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="消息不能为空。")

    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=content,
        message_type="chat",
    )
    db.add(user_message)
    db.flush()

    # 用第一条用户消息自动命名会话标题
    if session.title in {"新会话", "", None}:
        session.title = build_session_title(content)

    touch_session(session)
    db.commit()
    db.refresh(user_message)

    # 尝试识别为任务型消息
    latest_job = get_latest_related_job_for_session(db, session.id)

    context = {}
    if latest_job:
        context = {
            "meeting_list": latest_job.source_meeting_name,
            "agenda_item": latest_job.target_agenda_item,
        }

    try:
        parsed_task = parse_user_intent(content, context=context)
        documents = locate_documents_for_agenda(
            db=db,
            meeting_list=parsed_task["meeting_list"],
            agenda_item=parsed_task["agenda_item"],
        )

        if not documents:
            assistant_message = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=(
                    f"我识别到了任务，但没有找到 meeting_list={parsed_task['meeting_list']} "
                    f"且 agenda_item={parsed_task['agenda_item']} 的文稿。"
                ),
                message_type="error",
            )
            db.add(assistant_message)
            touch_session(session)
            db.commit()
            db.refresh(assistant_message)

            return {
                "session": serialize_session(db, session),
                "user_message": serialize_message(user_message),
                "assistant_message": serialize_message(assistant_message),
                "created_job_id": None,
            }

        job = create_job_and_items(
            db=db,
            user_prompt=content,
            parsed_task=parsed_task,
            documents=documents,
            chat_session_id=session.id,
            trigger_message_id=user_message.id,
        )

        session.latest_job_id = job.id

        if parsed_task["task_type"] == "agenda_document_comparison":
            assistant_content = (
                f"我已经识别到你的对比任务，并创建了后台任务 #{job.id}。\n"
                f"目标会议清单：{parsed_task['meeting_list']}\n"
                f"目标 Agenda：{parsed_task['agenda_item']}\n"
                f"对比重点：不同公司/来源之间的观点差异\n"
                f"匹配文稿数：{len(documents)}"
            )
        else:
            assistant_content = (
                f"我已经识别到你的分析任务，并创建了后台任务 #{job.id}。\n"
                f"目标会议清单：{parsed_task['meeting_list']}\n"
                f"目标 Agenda：{parsed_task['agenda_item']}\n"
                f"匹配文稿数：{len(documents)}"
            )

        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=assistant_content,
            message_type="task_created",
            related_job_id=job.id,
        )
        db.add(assistant_message)
        touch_session(session)
        db.commit()
        db.refresh(assistant_message)

        background_tasks.add_task(process_job, job.id)

        return {
            "session": serialize_session(db, session),
            "user_message": serialize_message(user_message),
            "assistant_message": serialize_message(assistant_message),
            "created_job_id": job.id,
        }

    except ValueError:
        reply = build_non_task_reply(latest_job, content)

        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=reply,
            message_type="chat",
            related_job_id=latest_job.id if latest_job else None,
        )
        db.add(assistant_message)
        touch_session(session)
        db.commit()
        db.refresh(assistant_message)

        return {
            "session": serialize_session(db, session),
            "user_message": serialize_message(user_message),
            "assistant_message": serialize_message(assistant_message),
            "created_job_id": None,
        }