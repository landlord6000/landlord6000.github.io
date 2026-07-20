from pathlib import Path
from PIL import Image

# Корневая папка с отчетами
ROOT = Path(r"E:\GitHub\landlord6000.github.io\travel")      # <-- измени на свою

# Максимальный размер длинной стороны
MAX_SIZE = 1600

# Качество JPEG
JPEG_QUALITY = 90

# Перебирать все папки photos
for photos_dir in ROOT.rglob("photos"):

    print(f"\nОбработка {photos_dir}")

    for img_path in photos_dir.glob("*.jp*"):

        try:
            img = Image.open(img_path)

            w, h = img.size

            # Уже маленькая
            if max(w, h) <= MAX_SIZE:
                continue

            scale = MAX_SIZE / max(w, h)

            new_size = (
                int(w * scale),
                int(h * scale)
            )

            img = img.resize(new_size, Image.Resampling.LANCZOS)

            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            img.save(
                img_path,
                "JPEG",
                quality=JPEG_QUALITY,
                optimize=True,
                progressive=True
            )

            print(
                f"{img_path.name}: "
                f"{w}x{h} -> {new_size[0]}x{new_size[1]}"
            )

        except Exception as e:
            print(img_path, e)

print("\nГотово.")