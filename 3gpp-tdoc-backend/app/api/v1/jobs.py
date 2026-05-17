import json
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.analysis_job import AnalysisJob
from app.models.analysis_job_item import AnalysisJobItem
from app.services.report_builder import ensure_job_report_dir, write_docx_report, write_markdown_report

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _safe_json_loads(value, default):
    if not value:
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def _iso(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def serialize_job_item(item: AnalysisJobItem):
    return {
        "id": item.id,
        "job_id": item.job_id,
        "document_id": item.document_id,
        "tdoc_id": item.tdoc_id,
        "title": item.title,
        "agenda_item": item.agenda_item,
        "order_index": item.order_index,
        "status": item.status,
        "download_status": item.download_status,
        "extract_status": item.extract_status,
        "summary_status": item.summary_status,
        "summary_text": item.summary_text,
        "report_md_path": item.report_md_path,
        "report_docx_path": item.report_docx_path,
        "error_message": item.error_message,
        "created_at": _iso(item.created_at),
        "updated_at": _iso(item.updated_at),
    }


def serialize_job(job: AnalysisJob):
    parsed_task = _safe_json_loads(job.parsed_task_json, {})
    logs = _safe_json_loads(job.logs_json, [])

    return {
        "id": job.id,
        "user_prompt": job.user_prompt,
        "task_type": job.task_type,
        "source_file_id": job.source_file_id,
        "source_meeting_name": job.source_meeting_name,
        "target_agenda_item": job.target_agenda_item,
        "status": job.status,
        "progress": int(job.progress or 0),
        "total_items": job.total_items,
        "completed_items": job.completed_items,
        "failed_items": job.failed_items,
        "parsed_task": parsed_task,
        "logs": logs,
        "final_report_md": job.final_report_md,
        "final_report_md_path": job.final_report_md_path,
        "final_report_docx_path": job.final_report_docx_path,
        "error_message": job.error_message,
        "items": [serialize_job_item(item) for item in job.items],
        "created_at": _iso(job.created_at),
        "updated_at": _iso(job.updated_at),
    }


@router.get("/{job_id}")
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="任务不存在。")

    return serialize_job(job)


@router.get("/{job_id}/download")
def download_job_report(
    job_id: int,
    format: str = Query(..., pattern="^(md|docx)$"),
    db: Session = Depends(get_db),
):
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="任务不存在。")

    report_dir = ensure_job_report_dir(job.id)

    if format == "md":
        if job.final_report_md_path and Path(job.final_report_md_path).exists():
            return FileResponse(
                path=job.final_report_md_path,
                media_type="text/markdown; charset=utf-8",
                filename=f"job_{job.id}_final_report.md",
            )

        if not job.final_report_md:
            raise HTTPException(status_code=404, detail="Markdown 报告尚未生成。")

        md_path = report_dir / "final_report.md"
        write_markdown_report(md_path, job.final_report_md)
        job.final_report_md_path = str(md_path)
        db.commit()

        return FileResponse(
            path=str(md_path),
            media_type="text/markdown; charset=utf-8",
            filename=f"job_{job.id}_final_report.md",
        )

    if format == "docx":
        if job.final_report_docx_path and Path(job.final_report_docx_path).exists():
            return FileResponse(
                path=job.final_report_docx_path,
                media_type=(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ),
                filename=f"job_{job.id}_final_report.docx",
            )

        if not job.final_report_md:
            raise HTTPException(status_code=404, detail="DOCX 报告尚未生成。")

        docx_path = report_dir / "final_report.docx"
        result = write_docx_report(
            docx_path,
            title=f"任务 {job.id} 汇总报告",
            paragraphs=[job.final_report_md],
        )
        if not result:
            raise HTTPException(
                status_code=500,
                detail="DOCX 生成功能不可用，请确认已安装 python-docx。",
            )

        job.final_report_docx_path = result
        db.commit()

        return FileResponse(
            path=result,
            media_type=(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ),
            filename=f"job_{job.id}_final_report.docx",
        )

    raise HTTPException(status_code=400, detail="不支持的格式。")

@router.get("/recent")
def get_recent_jobs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    jobs = (
        db.query(AnalysisJob)
        .order_by(AnalysisJob.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": job.id,
            "user_prompt": job.user_prompt,
            "task_type": job.task_type,
            "source_meeting_name": job.source_meeting_name,
            "target_agenda_item": job.target_agenda_item,
            "status": job.status,
            "progress": int(job.progress or 0),
            "total_items": job.total_items,
            "completed_items": job.completed_items,
            "failed_items": job.failed_items,
            "created_at": _iso(job.created_at),
            "updated_at": _iso(job.updated_at),
        }
        for job in jobs
    ]