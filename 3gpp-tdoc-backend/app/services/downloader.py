import os
import re
from pathlib import Path
from urllib.parse import urlparse, unquote

import httpx


DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    name = re.sub(r"\s+", " ", name).strip(" .")
    return name or "downloaded_file"


def filename_from_url(url: str) -> str:
    parsed = urlparse(url)
    name = Path(unquote(parsed.path)).name
    if not name:
        return "downloaded_file"
    return sanitize_filename(name)


def ensure_unique_path(path: Path) -> Path:
    if not path.exists():
        return path

    stem = path.stem
    suffix = path.suffix
    parent = path.parent
    counter = 1

    while True:
        candidate = parent / f"{stem}_{counter}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def download_document_by_url(url: str, subdir: str = "tdocs") -> str:
    if not url:
        raise ValueError("文稿链接为空，无法下载")

    target_dir = DOWNLOAD_DIR / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = filename_from_url(url)
    file_path = ensure_unique_path(target_dir / filename)

    with httpx.Client(timeout=120.0, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()

        with open(file_path, "wb") as f:
            f.write(resp.content)

    return str(file_path.resolve())