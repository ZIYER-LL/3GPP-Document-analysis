from __future__ import annotations

import os
import re
import threading
from typing import List, Dict

from faster_whisper import WhisperModel

_model = None
_model_lock = threading.Lock()


def get_stt_model_name() -> str:
    return os.getenv("STT_MODEL_NAME", "base")


def get_stt_device() -> str:
    return os.getenv("STT_DEVICE", "cpu")


def get_stt_compute_type() -> str:
    return os.getenv("STT_COMPUTE_TYPE", "int8")


def get_merge_max_gap_ms() -> int:
    return int(os.getenv("STT_MERGE_MAX_GAP_MS", "1200"))


def get_merge_max_chars() -> int:
    return int(os.getenv("STT_MERGE_MAX_CHARS", "120"))


def get_whisper_model() -> WhisperModel:
    global _model

    if _model is not None:
        return _model

    with _model_lock:
        if _model is None:
            _model = WhisperModel(
                get_stt_model_name(),
                device=get_stt_device(),
                compute_type=get_stt_compute_type(),
            )
    return _model


def _clean_text(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"\s+", "", text)
    text = text.replace("，。", "。")
    text = text.replace("。。", "。")
    text = text.replace("，，", "，")
    return text


def _looks_like_sentence_end(text: str) -> bool:
    return text.endswith(("。", "！", "？", ".", "!", "?", "；", ";"))


def _normalize_segment_text(text: str) -> str:
    text = _clean_text(text)
    if not text:
        return ""

    # 中文口语转写里如果没有明显句末标点，先不强行加句号，
    # 交给后续合并逻辑决定，避免每个小碎片都显得很生硬
    return text


def _merge_segments(raw_segments: List[Dict]) -> List[Dict]:
    if not raw_segments:
        return []

    merged: List[Dict] = []
    max_gap_ms = get_merge_max_gap_ms()
    max_chars = get_merge_max_chars()

    current = raw_segments[0].copy()

    for seg in raw_segments[1:]:
        same_speaker = (seg.get("speaker_label") or "") == (current.get("speaker_label") or "")
        gap_ms = seg["start_ms"] - current["end_ms"]

        current_text = current.get("text", "")
        next_text = seg.get("text", "")

        should_merge = (
            same_speaker
            and gap_ms <= max_gap_ms
            and len(current_text + next_text) <= max_chars
            and not _looks_like_sentence_end(current_text)
        )

        if should_merge:
            joiner = "" if current_text.endswith(("，", "、")) else "，"
            if not current_text:
                joiner = ""
            current["text"] = f"{current_text}{joiner}{next_text}".strip("，")
            current["end_ms"] = seg["end_ms"]
        else:
            merged.append(current)
            current = seg.copy()

    merged.append(current)

    # 第二轮：清理过短、过碎的段落，再尽量并到前一段
    final_segments: List[Dict] = []
    for seg in merged:
        text = (seg.get("text") or "").strip()
        if not text:
            continue

        if (
            final_segments
            and len(text) <= 10
            and seg["start_ms"] - final_segments[-1]["end_ms"] <= max_gap_ms
            and final_segments[-1].get("speaker_label") == seg.get("speaker_label")
            and len(final_segments[-1]["text"] + text) <= max_chars + 20
        ):
            prev = final_segments[-1]
            joiner = "" if prev["text"].endswith(("，", "、")) else "，"
            prev["text"] = f"{prev['text']}{joiner}{text}".strip("，")
            prev["end_ms"] = seg["end_ms"]
        else:
            final_segments.append(seg)

    # 最后统一补一个自然阅读更舒服的句末
    for seg in final_segments:
        t = (seg.get("text") or "").strip("，")
        if t and not _looks_like_sentence_end(t):
            t = f"{t}。"
        seg["text"] = t

    # 重排 index
    for idx, seg in enumerate(final_segments, start=1):
        seg["segment_index"] = idx

    return final_segments


def transcribe_audio(audio_path: str, language: str | None = None) -> list[dict]:
    model = get_whisper_model()

    segments, info = model.transcribe(
        audio_path,
        language=language or None,
        vad_filter=True,
        beam_size=1,
    )

    raw_results: list[dict] = []
    for idx, seg in enumerate(segments, start=1):
        text = _normalize_segment_text(seg.text or "")
        if not text:
            continue

        raw_results.append(
            {
                "segment_index": idx,
                "speaker_label": "Speaker 1",
                "speaker_name": None,
                "start_ms": int(seg.start * 1000),
                "end_ms": int(seg.end * 1000),
                "text": text,
            }
        )

    return _merge_segments(raw_results)