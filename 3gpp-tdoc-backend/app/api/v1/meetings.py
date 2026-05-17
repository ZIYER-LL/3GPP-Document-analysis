from __future__ import annotations

from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.meeting_record import MeetingRecord
from app.models.meeting_transcript_segment import MeetingTranscriptSegment
from app.schemas.meeting import (
    MeetingRecordRead,
    MeetingTranscriptResponse,
    MeetingTranscriptSegmentRead,
    MeetingUploadResponse,
)
from app.services.audio_preprocessor import MEETING_RAW_DIR, ensure_meeting_dirs
from app.services.meeting_minutes import (
    summarize_meeting_record,
    transcribe_meeting_record,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


def serialize_meeting(record: MeetingRecord) -> MeetingRecordRead:
    return MeetingRecordRead(
        id=record.id,
        title=record.title,
        source_type=record.source_type,
        original_filename=record.original_filename,
        language=record.language,
        duration_seconds=record.duration_seconds,
        status=record.status,
        transcript_text=record.transcript_text,
        summary_text=record.summary_text,
        summary_status=record.summary_status,
        summary_error=record.summary_error,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.get("", response_model=list[MeetingRecordRead])
def list_meetings(db: Session = Depends(get_db)):
    records = (
        db.query(MeetingRecord)
        .order_by(MeetingRecord.created_at.desc())
        .all()
    )
    return [serialize_meeting(record) for record in records]


@router.post("/upload", response_model=MeetingUploadResponse)
async def upload_meeting_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名为空。")

    suffix = Path(file.filename).suffix.lower()
    allowed = {".mp3", ".wav", ".m4a", ".mp4", ".aac"}
    if suffix not in allowed:
        raise HTTPException(status_code=400, detail=f"暂不支持的文件类型：{suffix}")

    ensure_meeting_dirs()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    saved_path = MEETING_RAW_DIR / f"{timestamp}_{file.filename}"

    content = await file.read()
    with open(saved_path, "wb") as f:
        f.write(content)

    record = MeetingRecord(
        title=Path(file.filename).stem,
        source_type="upload",
        original_filename=file.filename,
        audio_file_path=str(saved_path),
        language="zh",
        status="uploaded",
        summary_status="not_started",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return MeetingUploadResponse(meeting_id=record.id, status=record.status)


@router.post("/{meeting_id}/transcribe", response_model=MeetingUploadResponse)
def start_transcribe_meeting(
    meeting_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="会议记录不存在。")

    background_tasks.add_task(transcribe_meeting_record, record.id)
    return MeetingUploadResponse(meeting_id=record.id, status="transcribing")


@router.post("/{meeting_id}/summarize", response_model=MeetingUploadResponse)
def start_summarize_meeting(
    meeting_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="会议记录不存在。")

    if not record.transcript_text or not record.transcript_text.strip():
        raise HTTPException(status_code=400, detail="请先完成语音转写，再生成 AI 纪要。")

    record.status = "summarizing"
    record.summary_status = "processing"
    db.commit()

    background_tasks.add_task(summarize_meeting_record, record.id)
    return MeetingUploadResponse(meeting_id=record.id, status="summarizing")


@router.get("/{meeting_id}", response_model=MeetingRecordRead)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="会议记录不存在。")
    return serialize_meeting(record)


@router.get("/{meeting_id}/transcript", response_model=MeetingTranscriptResponse)
def get_meeting_transcript(meeting_id: int, db: Session = Depends(get_db)):
    record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="会议记录不存在。")

    segments = (
        db.query(MeetingTranscriptSegment)
        .filter(MeetingTranscriptSegment.meeting_record_id == meeting_id)
        .order_by(MeetingTranscriptSegment.segment_index.asc())
        .all()
    )

    return MeetingTranscriptResponse(
        meeting_id=meeting_id,
        segments=[
            MeetingTranscriptSegmentRead(
                id=seg.id,
                segment_index=seg.segment_index,
                speaker_label=seg.speaker_label,
                speaker_name=seg.speaker_name,
                start_ms=seg.start_ms,
                end_ms=seg.end_ms,
                text=seg.text,
                created_at=seg.created_at,
            )
            for seg in segments
        ],
    )