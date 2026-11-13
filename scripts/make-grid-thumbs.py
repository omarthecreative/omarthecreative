#!/usr/bin/env python3
"""Make the small grid-tile copies of every project picture.

The grid on the landing page shows each film and case study as a tile about
450px wide. The originals are up to 9 MB each, so the tiles stayed dark for
seconds while they downloaded. This script writes a 960px-wide JPEG copy of
each `img:` in src/carousel-config.js to src/assets/thumbs/.

Run it after adding or changing a project picture:

    python3 scripts/make-grid-thumbs.py

The naming rule must match gridThumb() in src/index.html:
    assets/wp-uploads/DJ_Red.jpg -> assets/thumbs/wp-uploads__DJ_Red.jpg
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
CONFIG = SRC / "carousel-config.js"
OUT = SRC / "assets" / "thumbs"
WIDTH = 960      # tile is ~450 CSS px; 2x screens and the hover zoom need ~960
QUALITY = 80


def thumb_name(src: str) -> str:
    rel = re.sub(r"^assets/", "", src)
    return re.sub(r"\.[^.]+$", "", rel.replace("/", "__")) + ".jpg"


def main() -> int:
    paths = re.findall(r"\bimg:\s*[\"']([^\"']+)[\"']", CONFIG.read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    made = skipped = 0
    for src in dict.fromkeys(paths):  # unique, in order
        original = SRC / src
        if not original.exists():
            print(f"missing original: {src}", file=sys.stderr)
            return 1
        target = OUT / thumb_name(src)
        if target.exists() and target.stat().st_mtime >= original.stat().st_mtime:
            skipped += 1
            continue
        with Image.open(original) as im:
            im = im.convert("RGBA")
            flat = Image.new("RGB", im.size, (0, 0, 0))  # transparent areas go black, like the tile
            flat.paste(im, mask=im.getchannel("A"))
            if flat.width > WIDTH:
                flat = flat.resize((WIDTH, round(flat.height * WIDTH / flat.width)), Image.LANCZOS)
            flat.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        made += 1
        print(f"{target.relative_to(SRC)}  {target.stat().st_size // 1024} KB")
    print(f"made {made}, up to date {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
