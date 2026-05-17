from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.imports import router as imports_router
from app.api.v1.documents import router as documents_router
from app.api.v1.agent import router as agent_router
from app.api.v1.jobs import router as jobs_router

from app.api.v1.meetings import router as meetings_router

from app.models.meeting_record import MeetingRecord  # noqa: F401
from app.models.meeting_transcript_segment import MeetingTranscriptSegment  # noqa: F401

from app.api.v1.chat import router as chat_router

from app.models.chat_session import ChatSession  # noqa: F401
from app.models.chat_message import ChatMessage

# 关键：让 SQLAlchemy 能识别新表
from app.models.analysis_job import AnalysisJob  # noqa: F401
from app.models.analysis_job_item import AnalysisJobItem  # noqa: F401

app = FastAPI(title=settings.app_name)

app.include_router(agent_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(meetings_router, prefix="/api/v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(imports_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}