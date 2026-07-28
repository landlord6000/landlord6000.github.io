#!/usr/bin/env python3
"""
Генерирует sitemap.xml с lastmod, взятым из даты последнего git-коммита
для каждого файла. Запускать из корня репозитория перед пушем
(или добавить в pre-commit / GitHub Actions).

Источник правды для дат - `git log`, а не системное время файла:
время модификации на диске сбрасывается при любом клоне/checkout,
а дата коммита - нет.
"""

import subprocess
import sys
from pathlib import Path
from xml.sax.saxutils import escape

BASE_URL = "https://landlord6000.github.io"
REPO_ROOT = Path(__file__).resolve().parent

# (относительный путь к файлу, url, changefreq, priority)
PAGES = [
    ("index.html", "/", "monthly", "1.0"),
    ("travel/moskvoretsky-2026/moskvoretsky-2026.html",
     "/travel/moskvoretsky-2026/moskvoretsky-2026.html", "monthly", "0.8"),
    ("travel/UAE-2024/UAE-2024.html",
     "/travel/UAE-2024/UAE-2024.html", "monthly", "0.8"),
    ("travel/karelia-2023/karelia-2023.html",
     "/travel/karelia-2023/karelia-2023.html", "monthly", "0.8"),
    ("travel/valday-2023/valday-2023.html",
     "/travel/valday-2023/valday-2023.html", "monthly", "0.8"),
    ("dnd/index.html", "/dnd/", "monthly", "0.6"),
]


def last_commit_date(rel_path: str) -> str | None:
    """Дата последнего коммита, затронувшего файл, в формате YYYY-MM-DD.
    None, если файл не отслеживается git (например, ещё не закоммичен)."""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", rel_path],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        return out or None
    except subprocess.CalledProcessError:
        return None


def build_sitemap() -> str:
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for rel_path, url_path, changefreq, priority in PAGES:
        full_path = REPO_ROOT / rel_path
        if not full_path.exists():
            print(f"[warn] файл не найден, пропускаю: {rel_path}", file=sys.stderr)
            continue

        lastmod = last_commit_date(rel_path)
        loc = escape(BASE_URL + url_path)

        lines.append("  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        if lastmod:
            lines.append(f"    <lastmod>{lastmod}</lastmod>")
        else:
            print(f"[warn] нет истории git для {rel_path}, lastmod пропущен", file=sys.stderr)
        lines.append(f"    <changefreq>{changefreq}</changefreq>")
        lines.append(f"    <priority>{priority}</priority>")
        lines.append("  </url>")

    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main():
    sitemap_path = REPO_ROOT / "sitemap.xml"
    content = build_sitemap()
    sitemap_path.write_text(content, encoding="utf-8")
    print(f"sitemap.xml обновлён: {sitemap_path}")


if __name__ == "__main__":
    main()