from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MeetingRecord(Base):
    __tablename__ = "meeting_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), default="upload")
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    audio_file_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    normalized_audio_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    language: Mapped[str | None] = mapped_column(String(50), nullable=True, default="zh")
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="uploaded")
    transcript_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    summary_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_status: Mapped[str] = mapped_column(String(50), default="not_started")
    summary_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    segments = relationship(
        "MeetingTranscriptSegment",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="MeetingTranscriptSegment.segment_index.asc()",
    )