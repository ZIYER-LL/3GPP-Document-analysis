from __future__ import annotations

import subprocess
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
MEETING_RAW_DIR = BACKEND_ROOT / "uploads" / "meetings" / "raw"
MEETING_NORMALIZED_DIR = BACKEND_ROOT / "uploads" / "meetings" / "normalized"


def ensure_meeting_dirs() -> None:
    MEETING_RAW_DIR.mkdir(parents=True, exist_ok=True)
    MEETING_NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)


def normalize_audio(input_path: str) -> str:
    """
    统一转成 16kHz / mono / wav，便于后续 ASR。
    依赖系统安装 ffmpeg。
    """
    ensure_meeting_dirs()

    input_file = Path(input_path)
    output_path = MEETING_NORMALIZED_DIR / f"{input_file.stem}_16k_mono.wav"

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_file),
        "-ac",
        "1",
        "-ar",
        "16000",
        str(output_path),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return str(output_path)


def probe_duration_seconds(input_path: str) -> int | None:
    """
    依赖系统安装 ffprobe。
    """
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        input_path,
    ]
    try:
        result = subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        value = (result.stdout or "").strip()
        if not value:
            return None
        return int(float(value))
    except Exception:
        return None