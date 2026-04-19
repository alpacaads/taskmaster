#!/usr/bin/env python3
"""
Batch-convert scene PNGs to JPEG, resized to max 1200px on the long edge.
Typical size drop: 2-3 MB PNG -> 100-250 KB JPEG.

Run from the repo root:
    python3 zombie-rpg/tools/compress-images.py

Writes <id>.jpg next to each <id>.png, then deletes the PNGs.
"""
import os
import sys
from pathlib import Path
from PIL import Image

IMAGES = Path(__file__).resolve().parent.parent / "images"
MAX_EDGE = 1200
QUALITY = 85

def convert_one(png_path: Path) -> tuple[int, int]:
    """Return (old_bytes, new_bytes)."""
    old_bytes = png_path.stat().st_size
    with Image.open(png_path) as im:
        im = im.convert("RGB")
        w, h = im.size
        scale = min(1.0, MAX_EDGE / max(w, h))
        if scale < 1.0:
            im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        jpg_path = png_path.with_suffix(".jpg")
        im.save(jpg_path, format="JPEG", quality=QUALITY, optimize=True, progressive=True)
    new_bytes = jpg_path.stat().st_size
    png_path.unlink()
    return old_bytes, new_bytes

def main() -> int:
    if not IMAGES.is_dir():
        print(f"no images dir at {IMAGES}", file=sys.stderr)
        return 1
    pngs = sorted(IMAGES.glob("*.png"))
    if not pngs:
        print("nothing to convert")
        return 0
    total_old = total_new = 0
    for p in pngs:
        try:
            o, n = convert_one(p)
        except Exception as e:
            print(f"  FAIL {p.name}: {e}")
            continue
        total_old += o
        total_new += n
        print(f"  {p.name:<32} {o/1024:>7.0f} KB -> {n/1024:>6.0f} KB  ({n*100/o:4.1f}%)")
    print(f"\n{len(pngs)} files: {total_old/1024/1024:.1f} MB -> {total_new/1024/1024:.1f} MB "
          f"({total_new*100/total_old:.1f}%)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
