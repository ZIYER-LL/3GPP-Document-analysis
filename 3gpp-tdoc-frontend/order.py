import os
from pathlib import Path
from typing import Iterable


def generate_tree(
    root: str | Path,
    max_depth: int = 3,
    ignore: Iterable[str] = (".git", "__pycache__", "node_modules", ".idea", ".vscode"),
    show_files: bool = True,
) -> str:
    root = Path(root).resolve()
    ignore_set = set(ignore)

    lines = [root.name]

    def _walk(current: Path, prefix: str = "", depth: int = 0) -> None:
        if depth >= max_depth:
            return

        try:
            entries = sorted(
                [p for p in current.iterdir() if p.name not in ignore_set],
                key=lambda x: (x.is_file(), x.name.lower())
            )
        except PermissionError:
            lines.append(prefix + "└── [Permission Denied]")
            return

        if not show_files:
            entries = [p for p in entries if p.is_dir()]

        for i, entry in enumerate(entries):
            is_last = i == len(entries) - 1
            connector = "└── " if is_last else "├── "
            lines.append(prefix + connector + entry.name)

            if entry.is_dir():
                extension = "    " if is_last else "│   "
                _walk(entry, prefix + extension, depth + 1)

    _walk(root)
    return "\n".join(lines)


if __name__ == "__main__":
    project_path = "."   # 改成你的目录路径
    tree_text = generate_tree(project_path, max_depth=4)

    print(tree_text)

    with open("directory_tree.txt", "w", encoding="utf-8") as f:
        f.write(tree_text)

    print("\n目录树已保存到 directory_tree.txt")