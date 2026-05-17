from fastapi import FastAPI
from app.core.config import settings
from app.core.database import Base, engine

from app.models.document import Document
from app.models.import_job import ImportJob

from app.api.v1.imports import router as imports_router
from app.api.v1.documents import router as documents_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.app_name)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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