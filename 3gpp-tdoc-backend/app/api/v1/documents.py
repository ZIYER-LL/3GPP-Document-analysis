from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException

from app.services.llm_summary import summarize_document
from app.services.text_extractor import extract_text

from app.core.database import get_db
from app.models.document import Document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("")
def list_documents(
    doc_role: str | None = Query(default=None),
    source: str | None = Query(default=None),
    release: str | None = Query(default=None),
    spec: str | None = Query(default=None),
    db: Session = Depends(get_db),
    agenda_item: str | None = Query(default=None),
):
    stmt = select(Document)

    if doc_role:
        stmt = stmt.where(Document.doc_role == doc_role)
    if source:
        stmt = stmt.where(Document.source == source)
    if release:
        stmt = stmt.where(Document.release == release)
    if spec:
        stmt = stmt.where(Document.spec == spec)
    if agenda_item:
        stmt = stmt.where(Document.agenda_item == agenda_item)

    result = db.execute(stmt).scalars().all()

    return [
        {
            "id": d.id,
            "tdoc_id": d.tdoc_id,
            "title": d.title,
            "source": d.source,
            "doc_role": d.doc_role,
            "agenda_item": d.agenda_item,
            "agenda_item_desc": d.agenda_item_desc,
            "release": d.release,
            "spec": d.spec,
            "is_cr": d.is_cr,
            "tdoc_url": d.tdoc_url,
            "summary_text": doc.summary_text,
            "summary_status": doc.summary_status,
            "summary_error": doc.summary_error,
        }
        for d in result
    ]


@router.get("/{doc_id}")
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, doc_id)
    if not doc:
        return {"error": "not found"}

    return {
        "id": doc.id,
        "tdoc_id": doc.tdoc_id,
        "tdoc_url": doc.tdoc_url,
        "title": doc.title,
        "source": doc.source,
        "contact": doc.contact,
        "type_raw": doc.type_raw,
        "for_raw": doc.for_raw,
        "abstract": doc.abstract,
        "agenda": doc.agenda,
        "agenda_item": doc.agenda_item,
        "agenda_item_desc": doc.agenda_item_desc,
        "tdoc_status": doc.tdoc_status,
        "release": doc.release,
        "spec": doc.spec,
        "version": doc.version,
        "related_wi": doc.related_wi,
        "cr": doc.cr,
        "cr_rev": doc.cr_rev,
        "reply_to": doc.reply_to,
        "doc_role": doc.doc_role,
        "is_cr": doc.is_cr,
        "confidence": doc.confidence,
    }

@router.post("/{doc_id}/summarize")
def summarize_one_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="document not found")

    if not doc.tdoc_url:
        raise HTTPException(status_code=400, detail="该文稿没有原始链接，无法摘要")

    try:
        doc.summary_status = "processing"
        db.commit()

        # 你这里先接你自己的下载逻辑
        # 假设它返回本地文件路径
        local_file_path = download_document_by_url(doc.tdoc_url)

        text = extract_text(local_file_path)
        if not text or len(text.strip()) < 50:
            raise ValueError("提取到的正文过短，无法生成可靠摘要")

        summary = summarize_document(
            metadata={
                "tdoc_id": doc.tdoc_id,
                "title": doc.title,
                "source": doc.source,
                "agenda_item": doc.agenda_item,
                "spec": doc.spec,
                "release": doc.release,
            },
            text=text,
        )

        doc.summary_text = summary
        doc.summary_status = "done"
        doc.summary_error = None
        doc.summary_updated_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "document_id": doc.id,
            "summary_status": doc.summary_status,
            "summary_text": doc.summary_text,
        }

    except Exception as e:
        doc.summary_status = "failed"
        doc.summary_error = str(e)
        doc.summary_updated_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))