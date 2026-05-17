from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import traceback

from summarizer import summarize_document, summarize_meeting_transcript

app = FastAPI(title="3GPP Model Service")


class SummarizeRequest(BaseModel):
    metadata: dict
    text: str


class MeetingSummaryRequest(BaseModel):
    metadata: dict
    transcript: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/summarize")
def summarize_endpoint(req: SummarizeRequest):
    try:
        payload = req.model_dump()

        print("[model_service] summarize request received")
        print("[model_service] payload keys =", list(payload.keys()))
        print("[model_service] text_length =", len(payload.get("text", "") or ""))
        print("[model_service] metadata =", payload.get("metadata"))

        summary = summarize_document(req.metadata, req.text)

        print("[model_service] summarize done")
        print("[model_service] summary_length =", len(summary or ""))

        return {"summary_text": summary}

    except Exception as e:
        print("[model_service] summarize error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/meeting-summary")
def meeting_summary_endpoint(req: MeetingSummaryRequest):
    try:
        payload = req.model_dump()

        print("[model_service] meeting-summary request received")
        print("[model_service] payload keys =", list(payload.keys()))
        print(
            "[model_service] transcript_length =",
            len(payload.get("transcript", "") or ""),
        )
        print("[model_service] metadata =", payload.get("metadata"))

        summary = summarize_meeting_transcript(req.metadata, req.transcript)

        print("[model_service] meeting-summary done")
        print("[model_service] summary_length =", len(summary or ""))

        return {"summary_text": summary}

    except Exception as e:
        print("[model_service] meeting-summary error:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))