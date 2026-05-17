from datetime import datetime
from pydantic import BaseModel


class MeetingTranscriptSegmentRead(BaseModel):
    id: int
    segment_index: int
    speaker_label: str | None = None
    speaker_name: str | None = None
    start_ms: int
    end_ms: int
    text: str
    created_at: datetime | None = None


class MeetingRecordRead(BaseModel):
    id: int
    title: str | None = None
    source_type: str
    original_filename: str | None = None
    language: str | None = None
    duration_seconds: int | None = None
    status: str
    transcript_text: str | None = None
    summary_text: str | None = None
    summary_status: str
    summary_error: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MeetingUploadResponse(BaseModel):
    meeting_id: int
    status: str


class MeetingTranscriptResponse(BaseModel):
    meeting_id: int
    segments: list[MeetingTranscriptSegmentRead]