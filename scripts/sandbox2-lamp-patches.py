"""Reproduce source-exact lamp-glass crops; default verifies without writing.

Requires Pillow. Run --write to regenerate the twelve committed tiny WebPs.
No network, user data, configuration, or other assets are accessed.
"""
from pathlib import Path
from PIL import Image
import hashlib
import io
import json
import math
import sys

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "docs/sandbox2-lamp-glass-patches.json").read_text())
for item in manifest:
    source = Image.open(root / "public/brand/environments" / (item["scene"] + ".webp")).convert("RGBA")
    patch = source.crop(tuple(item["sourceBounds"]))
    alpha = Image.new("L", patch.size)
    for y in range(patch.height):
        for x in range(patch.width):
            distance = math.hypot((x + .5) / patch.width * 2 - 1, (y + .5) / patch.height * 2 - 1)
            alpha.putpixel((x, y), round(max(0, min(1, (.92 - distance) / .50)) * 255))
    patch.putalpha(alpha)
    encoded = io.BytesIO()
    patch.save(encoded, format="WEBP", lossless=True, method=6)
    contents = encoded.getvalue()
    target = root / "public" / item["output"].lstrip("/")
    assert hashlib.sha256(contents).hexdigest() == item["sha256"], item["output"]
    if "--write" in sys.argv:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(contents)
    assert contents == target.read_bytes(), item["output"]
print(f"PASS {len(manifest)} source-exact transparent lamp crops, {sum((root / 'public' / i['output'].lstrip('/')).stat().st_size for i in manifest):,} bytes total")
