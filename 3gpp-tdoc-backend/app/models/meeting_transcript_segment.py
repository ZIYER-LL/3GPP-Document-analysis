from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MeetingTranscriptSegment(Base):
    __tablename__ = "meeting_transcript_segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    meeting_record_id: Mapped[int] = mapped_column(
        ForeignKey("meeting_records.id"),
        index=True,
    )

    segment_index: Mapped[int] = mapped_column(Integer)
    speaker_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    speaker_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)

    text: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    meeting = relationship("MeetingRecord", back_populates="segments")