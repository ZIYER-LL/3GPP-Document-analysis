from __future__ import annotations

import os
from pathlib import Path

import requests

from app.core.database import SessionLocal
from app.models.meeting_record import MeetingRecord
from app.models.meeting_transcript_segment import MeetingTranscriptSegment
from app.services.audio_preprocessor import normalize_audio, probe_duration_seconds
from app.services.speech_to_text import transcribe_audio

MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://127.0.0.1:9000")


def ms_to_ts(ms: int) -> str:
    total_seconds = max(ms // 1000, 0)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def build_transcript_text(segments: list[dict]) -> str:
    lines: list[str] = []
    for seg in segments:
        lines.append(
            f"[{ms_to_ts(seg['start_ms'])} - {ms_to_ts(seg['end_ms'])}] "
            f"{seg.get('speaker_label') or 'Speaker'}: {seg['text']}"
        )
    return "\n".join(lines)


def call_meeting_summary_model(metadata: dict, transcript: str) -> str:
    url = f"{MODEL_SERVICE_URL}/meeting-summary"
    payload = {
        "metadata": metadata,
        "transcript": transcript,
    }

    response = requests.post(url, json=payload, timeout=(10, 420))
    response.raise_for_status()

    data = response.json()
    if "summary_text" not in data:
        raise ValueError(f"模型服务返回格式异常：{data}")

    return data["summary_text"]


def transcribe_meeting_record(meeting_id: int) -> None:
    db = SessionLocal()

    try:
        record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
        if not record:
            return

        record.status = "transcribing"
        record.summary_error = None
        db.commit()

        if not record.audio_file_path:
            raise ValueError("未找到音频文件路径。")

        normalized_audio_path = normalize_audio(record.audio_file_path)
        record.normalized_audio_path = normalized_audio_path
        record.duration_seconds = probe_duration_seconds(normalized_audio_path)
        db.commit()

        segments = transcribe_audio(
            normalized_audio_path,
            language=record.language or None,
        )

        if not segments:
            raise ValueError("语音转写结果为空。")

        db.query(MeetingTranscriptSegment).filter(
            MeetingTranscriptSegment.meeting_record_id == record.id
        ).delete()
        db.commit()

        for seg in segments:
            db.add(
                MeetingTranscriptSegment(
                    meeting_record_id=record.id,
                    segment_index=seg["segment_index"],
                    speaker_label=seg.get("speaker_label"),
                    speaker_name=seg.get("speaker_name"),
                    start_ms=seg["start_ms"],
                    end_ms=seg["end_ms"],
                    text=seg["text"],
                )
            )
        db.commit()

        transcript_text = build_transcript_text(segments)
        record.transcript_text = transcript_text
        record.status = "transcribed"

        # 转写完成后，不自动生成 AI 纪要
        if record.summary_status == "failed":
            record.summary_status = "not_started"
            record.summary_error = None

        db.commit()

    except Exception as exc:
        db.rollback()
        record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
        if record:
            record.status = "failed"
            record.summary_error = str(exc)
            db.commit()
    finally:
        db.close()


def summarize_meeting_record(meeting_id: int) -> None:
    db = SessionLocal()

    try:
        record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
        if not record:
            return

        if not record.transcript_text or not record.transcript_text.strip():
            raise ValueError("当前会议还没有可用转写内容，请先执行转写。")

        record.summary_status = "processing"
        db.commit()

        summary_text = call_meeting_summary_model(
            metadata={
                "title": record.title or Path(record.original_filename or "").stem,
                "language": record.language or "zh",
                "duration_seconds": record.duration_seconds,
                "source_type": record.source_type,
            },
            transcript=record.transcript_text,
        )

        record.summary_text = summary_text
        record.summary_status = "done"

        # 如果转写已完成，整体状态更新为 done
        if record.status in {"transcribed", "summarizing"}:
            record.status = "done"

        record.summary_error = None
        db.commit()

    except Exception as exc:
        db.rollback()
        record = db.query(MeetingRecord).filter(MeetingRecord.id == meeting_id).first()
        if record:
            record.summary_status = "failed"
            record.summary_error = str(exc)

            # 如果只是纪要失败，但 transcript 已有，保留 transcribed 状态
            if record.transcript_text and record.transcript_text.strip():
                record.status = "transcribed"
            else:
                record.status = "failed"

            db.commit()
    finally:
        db.close()