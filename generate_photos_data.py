#!/usr/bin/env python3
"""
generate_photos_data.py

Сканирует travel/media/<report>-media/thumbs/*.jpg (сабмодули с медиа)
и собирает данные в photos.js (глобальный массив ALL_PHOTOS), который
index.html подключает через <script src="photos.js"> и использует для
случайного выбора фото на главной странице.

Запускать из корня репозитория:
    python generate_photos_data.py

Логика для каждой папки travel/media/<folder>-media/:
  - имя отчёта = <folder>-media без суффикса "-media"
  - фото берём из travel/media/<folder>-media/thumbs/*.jpg
  - ссылка на отчёт = travel/<folder>/<folder>.html
  - название отчёта достаём из <h1>...</h1> внутри этого html;
    если не нашли — берём имя папки как есть (и предупреждаем).

Никаких подписей (caption) не генерируем: под фото на сайте
выводится только название отчёта.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TRAVEL_DIR = ROOT / "travel"
MEDIA_DIR = TRAVEL_DIR / "media"
OUTPUT_JS = ROOT / "photos.js"

IMG_EXTENSIONS = {".jpg", ".jpeg"}
MEDIA_SUFFIX = "-media"

H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>")


def strip_html(text: str) -> str:
    text = TAG_RE.sub("", text)
    text = (
        text.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&laquo;", "«")
        .replace("&raquo;", "»")
        .replace("&mdash;", "—")
        .replace("&ndash;", "–")
    )
    return " ".join(text.split())


def get_report_title(folder: Path, report_html: Path) -> str:
    if report_html.exists():
        html = report_html.read_text(encoding="utf-8", errors="ignore")
        match = H1_RE.search(html)
        if match:
            title = strip_html(match.group(1))
            if title:
                return title
        print(f"  [!] Не нашёл <h1> в {report_html.relative_to(ROOT)}, "
              f"использую имя папки")
    else:
        print(f"  [!] Не найден файл отчёта {report_html.relative_to(ROOT)}, "
              f"использую имя папки")
    return folder.name


def natural_key(path: Path):
    # Чтобы 2.jpg шёл раньше 10.jpg
    parts = re.split(r"(\d+)", path.stem)
    return [int(p) if p.isdigit() else p for p in parts]


def collect_photos():
    if not MEDIA_DIR.is_dir():
        raise SystemExit(f"Не найдена папка {MEDIA_DIR}")

    photos = []
    media_folders = sorted(p for p in MEDIA_DIR.iterdir() if p.is_dir())

    for media_folder in media_folders:
        if not media_folder.name.endswith(MEDIA_SUFFIX):
            print(f"[skip] {media_folder.name}: имя папки не оканчивается на "
                  f"'{MEDIA_SUFFIX}'")
            continue

        report_name = media_folder.name[: -len(MEDIA_SUFFIX)]

        thumbs_dir = media_folder / "thumbs"
        if not thumbs_dir.is_dir():
            print(f"[skip] {report_name}: нет папки thumbs/ в {media_folder.name}")
            continue

        folder = TRAVEL_DIR / report_name
        report_html = folder / f"{report_name}.html"
        title = get_report_title(folder, report_html)
        link = f"travel/{report_name}/{report_name}.html"

        images = sorted(
            (p for p in thumbs_dir.iterdir() if p.suffix.lower() in IMG_EXTENSIONS),
            key=natural_key,
        )
        if not images:
            print(f"[skip] {report_name}: в thumbs/ нет .jpg файлов")
            continue

        for img_path in images:
            photos.append({
                "img": f"travel/media/{media_folder.name}/thumbs/{img_path.name}",
                "link": link,
                "title": title,
            })

        print(f"[ok]   {report_name}: {len(images)} фото, title='{title}'")

    return photos


def write_photos_js(photos):
    header = (
        "// Автоматически сгенерировано generate_photos_data.py — не редактировать руками.\n"
        "// Чтобы обновить: положи новые фото в travel/media/<report>-media/photos/,\n"
        "// прогони squeeze_jpg_to_thumbs, затем запусти python generate_photos_data.py заново.\n\n"
    )
    body = "const ALL_PHOTOS = " + json.dumps(photos, ensure_ascii=False, indent=2) + ";\n"
    OUTPUT_JS.write_text(header + body, encoding="utf-8")
    print(f"\nГотово: {len(photos)} фото записано в {OUTPUT_JS.relative_to(ROOT)}")


if __name__ == "__main__":
    photos = collect_photos()
    write_photos_js(photos)