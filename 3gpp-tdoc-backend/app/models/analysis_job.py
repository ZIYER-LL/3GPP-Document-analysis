from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_prompt = Column(Text, nullable=False)
    task_type = Column(String(100), nullable=False, default="agenda_batch_analysis")

    source_file_id = Column(Integer, nullable=True)
    source_meeting_name = Column(String(255), nullable=True)
    target_agenda_item = Column(String(50), nullable=True)

    status = Column(String(50), nullable=False, default="queued")
    progress = Column(Float, nullable=False, default=0.0)

    chat_session_id = Column(Integer, nullable=True, index=True)
    trigger_message_id = Column(Integer, nullable=True, index=True)

    total_items = Column(Integer, nullable=False, default=0)
    completed_items = Column(Integer, nullable=False, default=0)
    failed_items = Column(Integer, nullable=False, default=0)

    parsed_task_json = Column(Text, nullable=True)
    logs_json = Column(Text, nullable=True, default="[]")

    final_report_md = Column(Text, nullable=True)
    final_report_md_path = Column(String(500), nullable=True)
    final_report_docx_path = Column(String(500), nullable=True)

    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    items = relationship(
        "AnalysisJobItem",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="AnalysisJobItem.order_index.asc()",
    )