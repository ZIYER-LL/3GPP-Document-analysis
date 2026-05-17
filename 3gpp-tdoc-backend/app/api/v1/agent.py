from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.agent import AgentExecuteRequest
from app.services.agent_parser import parse_user_intent
from app.services.document_locator import locate_documents_for_agenda
from app.services.job_orchestrator import create_job_and_items, process_job

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/execute")
def execute_agent_task(
    payload: AgentExecuteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    try:
        parsed_task = parse_user_intent(payload.message)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    documents = locate_documents_for_agenda(
        db=db,
        meeting_list=parsed_task["meeting_list"],
        agenda_item=parsed_task["agenda_item"],
    )

    if not documents:
        raise HTTPException(
            status_code=404,
            detail=(
                f"未找到 meeting_list={parsed_task['meeting_list']} "
                f"且 agenda_item={parsed_task['agenda_item']} 的文稿。"
            ),
        )

    job = create_job_and_items(
        db=db,
        user_prompt=payload.message,
        parsed_task=parsed_task,
        documents=documents,
    )

    background_tasks.add_task(process_job, job.id)

    return {
        "job_id": job.id,
        "status": job.status,
        "parsed_task": parsed_task,
        "message": f"任务已创建，共匹配到 {len(documents)} 篇文稿。",
    }