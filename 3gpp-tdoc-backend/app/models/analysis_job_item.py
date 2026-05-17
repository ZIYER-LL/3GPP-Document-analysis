from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class AnalysisJobItem(Base):
    __tablename__ = "analysis_job_items"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("analysis_jobs.id"), nullable=False, index=True)

    document_id = Column(Integer, nullable=True)
    tdoc_id = Column(String(100), nullable=True)
    title = Column(String(500), nullable=False)
    agenda_item = Column(String(50), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)

    status = Column(String(50), nullable=False, default="queued")
    download_status = Column(String(50), nullable=False, default="pending")
    extract_status = Column(String(50), nullable=False, default="pending")
    summary_status = Column(String(50), nullable=False, default="pending")

    local_file_path = Column(String(500), nullable=True)
    extracted_files_json = Column(Text, nullable=True)

    summary_text = Column(Text, nullable=True)
    report_md_path = Column(String(500), nullable=True)
    report_docx_path = Column(String(500), nullable=True)

    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    job = relationship("AnalysisJob", back_populates="items")