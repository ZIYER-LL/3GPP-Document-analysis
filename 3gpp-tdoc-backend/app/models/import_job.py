from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50))  # upload / url
    status: Mapped[str] = mapped_column(String(50), default="pending")
    total_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    success_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    failed_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())