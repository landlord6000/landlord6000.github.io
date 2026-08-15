#!/usr/bin/env python3
"""
Генерирует "display"-версии фото из оригиналов: под размер показа
в лайтбоксе (.lb-stage: 90vw x 82vh), без видимой потери качества.

Оригиналы (photos/) НЕ трогает и не перезаписывает — только читает.
thumbs/ тоже не трогает.

Использование:
    python3 make_display.py <report_dir>

Где <report_dir> — папка конкретного отчёта, содержащая photos/
(например: travel/sorolansaari-2026/). Результат кладётся рядом,
в travel/sorolansaari-2026/display/.

Повторный запуск безопасен: уже готовые файлы пропускаются,
если оригинал не менялся (сравнение по mtime).
"""

import sys
import os
from pathlib import Path
from PIL import Image, ImageOps

# Длинная сторона: с запасом под 82vh на 4K/retina мониторе
# (2x DPR * ~1300px реальной высоты вьюпорта ≈ 2600, берём чуть больше).
MAX_SIDE = 2560

# 90-92 — граница, на которой JPEG-артефакты практически не видны
# глазу даже при 100% зуме на фото с обычным содержанием (не студийная
# продуктовая съёмка на белом фоне, где вылезает любая mach-band).
QUALITY = 91


def process_one(src: Path, dst: Path) -> str:
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return "skip"

    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)  # сначала честно поворачиваем по EXIF...
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")

        w, h = im.size
        longest = max(w, h)
        if longest > MAX_SIDE:
            scale = MAX_SIDE / longest
            im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

        dst.parent.mkdir(parents=True, exist_ok=True)
        # ...а дальше сохраняем БЕЗ EXIF (exif=b""), поэтому лишний
        # поворот в браузере даже теоретически невозможен.
        im.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True, exif=b"")
    return "ok"


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    report_dir = Path(sys.argv[1])
    src_dir = report_dir / "photos"
    dst_dir = report_dir / "display"

    if not src_dir.is_dir():
        print(f"Не нашёл {src_dir}")
        sys.exit(1)

    files = sorted([p for p in src_dir.iterdir() if p.suffix.lower() in (".jpg", ".jpeg")])
    if not files:
        print(f"В {src_dir} нет .jpg файлов")
        sys.exit(1)

    total_src = total_dst = 0
    done = skipped = 0

    for src in files:
        dst = dst_dir / src.name
        status = process_one(src, dst)
        total_src += src.stat().st_size
        total_dst += dst.stat().st_size
        if status == "ok":
            done += 1
            print(f"  {src.name}: {src.stat().st_size/1024:.0f} kB -> {dst.stat().st_size/1024:.0f} kB")
        else:
            skipped += 1

    print(f"\nГотово: {done} сгенерировано, {skipped} пропущено (уже актуальны)")
    print(f"photos/: {total_src/1024/1024:.1f} MB -> display/: {total_dst/1024/1024:.1f} MB "
          f"({100*(1-total_dst/max(total_src,1)):.0f}% экономии)")


if __name__ == "__main__":
    main()
