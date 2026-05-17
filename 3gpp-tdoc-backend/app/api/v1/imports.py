import os
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.import_job import ImportJob
from app.models.document import Document
from app.services.excel_importer import import_tdoc_sheet
from app.services.classifier import classify_record

router = APIRouter(prefix="/imports", tags=["imports"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/tdoc-list")
async def upload_tdoc_list(file: UploadFile = File(...), db: Session = Depends(get_db)):
    save_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(save_path, "wb") as f:
        f.write(await file.read())

    job = ImportJob(filename=file.filename, source_type="upload", status="processing")
    db.add(job)
    db.commit()
    db.refresh(job)

    records = import_tdoc_sheet(save_path)

    success_count = 0
    for rec in records:
        rec = classify_record(rec)
        doc = Document(import_job_id=job.id, **rec)
        db.add(doc)
        success_count += 1

    job.status = "done"
    job.total_rows = len(records)
    job.success_rows = success_count
    job.failed_rows = 0

    db.commit()

    return {
        "job_id": job.id,
        "total_rows": len(records),
        "success_rows": success_count,
    }