from sqlalchemy import String, Integer, Text, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    import_job_id: Mapped[int | None] = mapped_column(ForeignKey("import_jobs.id"), nullable=True)

    tdoc_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    tdoc_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)

    type_raw: Mapped[str | None] = mapped_column(String(100), nullable=True)
    for_raw: Mapped[str | None] = mapped_column(String(100), nullable=True)
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)

    agenda: Mapped[str | None] = mapped_column(String(100), nullable=True)
    agenda_item: Mapped[str | None] = mapped_column(String(100), nullable=True)
    agenda_item_desc: Mapped[str | None] = mapped_column(Text, nullable=True)

    tdoc_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    uploaded_raw: Mapped[str | None] = mapped_column(String(100), nullable=True)

    is_revision_of: Mapped[str | None] = mapped_column(String(100), nullable=True)
    revised_to: Mapped[str | None] = mapped_column(String(100), nullable=True)
    revised_to_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    release: Mapped[str | None] = mapped_column(String(50), nullable=True)
    spec: Mapped[str | None] = mapped_column(String(50), nullable=True)
    version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    related_wi: Mapped[str | None] = mapped_column(Text, nullable=True)

    cr: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cr_rev: Mapped[str | None] = mapped_column(String(50), nullable=True)

    reply_to: Mapped[str | None] = mapped_column(Text, nullable=True)
    to_field: Mapped[str | None] = mapped_column(Text, nullable=True)
    cc_field: Mapped[str | None] = mapped_column(Text, nullable=True)
    original: Mapped[str | None] = mapped_column(Text, nullable=True)

    doc_role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_cr: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[str | None] = mapped_column(String(20), nullable=True)

    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    summary_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_status: Mapped[str | None] = mapped_column(String(50), nullable=True, default="not_started")
    summary_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)