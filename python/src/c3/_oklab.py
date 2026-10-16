"""OKLab and OKLCH conversions for sRGB colors. https://bottosson.github.io/posts/oklab/"""

from __future__ import annotations

import math
from collections.abc import Sequence

from ._color import parse_rgb

Lab = tuple[float, float, float]
Lch = tuple[float, float, float]


def _to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _from_linear(c: float) -> float:
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def srgb_to_oklab(R: float, G: float, B: float) -> Lab:
    r = _to_linear(R)
    g = _to_linear(G)
    b = _to_linear(B)
    l = math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m = math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s = math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return (
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    )


def _oklab_to_linear_srgb(lab: Lab) -> tuple[float, float, float]:
    L, a, b = lab
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
    return (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    )


def lch_to_lab(lch: Lch) -> Lab:
    L, C, H = lch
    h = (H * math.pi) / 180
    return (L, C * math.cos(h), C * math.sin(h))


def lab_to_lch(lab: Lab) -> Lch:
    L, a, b = lab
    H = (math.atan2(b, a) * 180) / math.pi
    return (L, math.hypot(a, b), H + 360 if H < 0 else H)


def parse_oklab(color: str) -> Lab:
    """Any CSS color string to OKLab. Raises ValueError if the color can't be parsed."""
    rgb = parse_rgb(color)
    if rgb is None:
        raise ValueError(f"Invalid color: {color}")
    r, g, b = rgb
    return srgb_to_oklab(r / 255, g / 255, b / 255)


def parse_oklch(color: str) -> Lch:
    return lab_to_lch(parse_oklab(color))


def color_to_oklab(color: str | Sequence[float]) -> Lab:
    """A CSS color string, or (r, g, b[, a]) floats in [0, 1] like a matplotlib colormap gives, to OKLab."""
    if isinstance(color, str):
        return parse_oklab(color)
    try:
        r, g, b = (float(c) for c in list(color)[:3])
    except (TypeError, ValueError):
        raise ValueError(f"Invalid color: {color!r}") from None
    if math.isnan(r) or math.isnan(g) or math.isnan(b):
        raise ValueError(f"Invalid color: {color!r}")
    return srgb_to_oklab(r, g, b)


EPS = 1e-6


def in_gamut(lab: Lab) -> bool:
    r, g, b = _oklab_to_linear_srgb(lab)
    return -EPS <= r <= 1 + EPS and -EPS <= g <= 1 + EPS and -EPS <= b <= 1 + EPS


def gamut_map(lch: Lch) -> Lch:
    """Reduce chroma (keeping lightness and hue) until the color fits in sRGB."""
    L, C, H = lch
    if in_gamut(lch_to_lab(lch)):
        return lch
    lo = 0.0
    hi = C
    for _ in range(16):
        mid = (lo + hi) / 2
        if in_gamut(lch_to_lab((L, mid, H))):
            lo = mid
        else:
            hi = mid
    return (L, lo, H)


def _clamp01(x: float) -> float:
    return min(1.0, max(0.0, x))


def _byte(c: float) -> int:
    """A linear sRGB channel as a byte, with halves rounded up."""
    return math.floor(_clamp01(_from_linear(_clamp01(c))) * 255 + 0.5)


def lab_to_hex(lab: Lab) -> str:
    r, g, b = (_byte(c) for c in _oklab_to_linear_srgb(lab))
    return f"#{r:02x}{g:02x}{b:02x}"


def lch_to_hex(lch: Lch) -> str:
    return lab_to_hex(lch_to_lab(gamut_map(lch)))


def lab_distance(a: Lab, b: Lab) -> float:
    return math.dist(a, b)


def distance(a: str, b: str) -> float:
    """Euclidean distance in OKLab between two CSS colors. About 0.02 is just noticeable."""
    return lab_distance(parse_oklab(a), parse_oklab(b))
