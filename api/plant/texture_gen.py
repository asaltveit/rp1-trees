"""
Texture Generation — Pillow-only, no cv2, no scipy.

Generates procedural bark and leaf textures under 0.5MP.
  bark: 512×512 RGB  (0.262 MP)
  leaf: 256×256 RGBA (0.066 MP)
"""

import colorsys
import io
from typing import Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def _hsv_to_rgb255(h: float, s: float, v: float) -> Tuple[int, int, int]:
    """Convert HSV (0–360, 0–100, 0–100) to RGB (0–255)."""
    r, g, b = colorsys.hsv_to_rgb(h / 360.0, s / 100.0, v / 100.0)
    return int(r * 255), int(g * 255), int(b * 255)


def generate_bark_texture(bark_color_hsv: list, size: int = 512, seed: int = 0) -> Image.Image:
    """
    Generate a bark texture as a PIL Image (RGB).
    Uses vertical streaks + horizontal cracks for realism.
    Max size: 512×512 = 0.262 MP (well under 0.5 MP limit).
    """
    size = min(size, 512)  # hard cap
    h, s, v = bark_color_hsv[0], bark_color_hsv[1], bark_color_hsv[2]
    r, g, b = _hsv_to_rgb255(h, s, v)

    base = np.full((size, size, 3), [r, g, b], dtype=np.uint8)
    rng = np.random.default_rng(seed)

    # Vertical streaks (bark grain)
    n_streaks = int(size * 0.25)
    for _ in range(n_streaks):
        x = rng.integers(0, size)
        w = rng.integers(1, max(2, size // 128))
        dark = rng.uniform(0.55, 0.92)
        x_end = min(x + w, size)
        base[:, x:x_end] = (base[:, x:x_end] * dark).astype(np.uint8)

    # Horizontal cracks
    n_cracks = int(size * 0.06)
    for _ in range(n_cracks):
        y = rng.integers(0, size)
        length = rng.integers(size // 25, size // 6)
        x0 = rng.integers(0, max(1, size - length))
        x1 = min(x0 + length, size)
        darkness = rng.uniform(0.45, 0.72)
        base[y, x0:x1] = (base[y, x0:x1] * darkness).astype(np.uint8)

    # Slight noise for texture
    noise = rng.integers(-12, 13, base.shape, dtype=np.int16)
    base = np.clip(base.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    img = Image.fromarray(base, mode="RGB")
    # Slight blur for cohesion
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    return img


def generate_leaf_texture(leaf_color_hsv: list, size: int = 256, seed: int = 0) -> Image.Image:
    """
    Generate a leaf texture as a PIL Image (RGBA).
    Oval leaf sprite with central vein.
    Max size: 256×256 = 0.066 MP.
    """
    size = min(size, 256)  # hard cap
    h, s, v = leaf_color_hsv[0], leaf_color_hsv[1], leaf_color_hsv[2]
    r, g, b = _hsv_to_rgb255(h, s, v)

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    # Oval leaf body
    margin_x = max(4, size // 64)
    margin_y = size // 4
    draw.ellipse(
        [margin_x, margin_y, size - margin_x, size - margin_y],
        fill=(r, g, b, 220),
    )

    # Central vein (slightly darker)
    vein_r = max(0, r - 25)
    vein_g = max(0, g - 25)
    vein_b = max(0, b - 20)
    draw.line(
        [(cx, margin_y + 4), (cx, size - margin_y - 4)],
        fill=(vein_r, vein_g, vein_b, 200),
        width=max(1, size // 128),
    )

    # 2–3 lateral veins
    n_lateral = 3
    for i in range(1, n_lateral + 1):
        t = i / (n_lateral + 1)
        y_pos = int(margin_y + t * (size - 2 * margin_y))
        half_w = int((size // 2 - margin_x) * (1 - abs(t - 0.5)))
        draw.line([(cx, y_pos), (cx + half_w, y_pos - size // 12)],
                  fill=(vein_r, vein_g, vein_b, 160), width=1)
        draw.line([(cx, y_pos), (cx - half_w, y_pos - size // 12)],
                  fill=(vein_r, vein_g, vein_b, 160), width=1)

    return img


def texture_to_png_bytes(img: Image.Image) -> bytes:
    """Encode a PIL Image to PNG bytes (for embedding in GLB)."""
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=False, compress_level=6)
    return buf.getvalue()
