from __future__ import annotations

import shutil
import tempfile
import zipfile
from pathlib import Path


SUPPORTED_DOC_SUFFIXES = {".pdf", ".docx", ".txt", ".md"}
SUPPORTED_ARCHIVE_SUFFIXES = {".zip"}

MAX_NESTED_DEPTH = 3
MAX_COLLECTED_FILES = 20


def is_archive(file_path: str | Path) -> bool:
    return Path(file_path).suffix.lower() in SUPPORTED_ARCHIVE_SUFFIXES


def is_supported_doc(file_path: str | Path) -> bool:
    return Path(file_path).suffix.lower() in SUPPORTED_DOC_SUFFIXES


def safe_member_path(base_dir: Path, member_name: str) -> Path:
    """
    防止 zip slip：避免解压到目标目录之外
    """
    target_path = (base_dir / member_name).resolve()
    if not str(target_path).startswith(str(base_dir.resolve())):
        raise ValueError(f"非法压缩包路径: {member_name}")
    return target_path


def extract_zip(zip_path: str | Path, output_dir: str | Path) -> list[Path]:
    zip_path = Path(zip_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    extracted_paths: list[Path] = []

    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            if member.is_dir():
                continue

            target_path = safe_member_path(output_dir, member.filename)
            target_path.parent.mkdir(parents=True, exist_ok=True)

            with zf.open(member) as src, open(target_path, "wb") as dst:
                shutil.copyfileobj(src, dst)

            extracted_paths.append(target_path)

    return extracted_paths


def resolve_analysis_files(file_path: str | Path, max_depth: int = MAX_NESTED_DEPTH) -> tuple[list[Path], Path]:
    """
    返回：
    - 可分析文件列表
    - 临时工作目录路径（调用方用完后自行清理）
    """
    source_path = Path(file_path).resolve()
    work_dir = Path(tempfile.mkdtemp(prefix="tdoc_extract_"))

    collected: list[Path] = []

    def _walk(path: Path, depth: int):
        if len(collected) >= MAX_COLLECTED_FILES:
            return

        if is_supported_doc(path):
            collected.append(path)
            return

        if is_archive(path):
            if depth >= max_depth:
                return

            current_extract_dir = work_dir / f"level_{depth}_{path.stem}"
            current_extract_dir.mkdir(parents=True, exist_ok=True)

            try:
                extracted = extract_zip(path, current_extract_dir)
            except zipfile.BadZipFile:
                return

            for item in extracted:
                if len(collected) >= MAX_COLLECTED_FILES:
                    break
                _walk(item, depth + 1)

    if is_archive(source_path):
        _walk(source_path, 0)
    elif is_supported_doc(source_path):
        collected.append(source_path)
    else:
        raise ValueError(f"暂不支持该文件类型: {source_path.suffix.lower()}")

    return collected, work_dir


def choose_primary_file(files: list[Path]) -> Path | None:
    """
    如果只想选一个主文件来分析，可以用这个策略。
    当前策略：
    1. 优先 pdf
    2. 再 docx
    3. 再 txt/md
    4. 同类型选体积更大的
    """
    if not files:
        return None

    priority = {
        ".pdf": 1,
        ".docx": 2,
        ".txt": 3,
        ".md": 4,
    }

    def sort_key(p: Path):
        return (priority.get(p.suffix.lower(), 99), -p.stat().st_size)

    return sorted(files, key=sort_key)[0]