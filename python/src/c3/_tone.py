"""Tones: the region of OKLCH color space to pick colors from."""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from typing import Literal, TypedDict, Union

from ._oklab import Lab, Lch, gamut_map, lch_to_lab, parse_oklch

Range = tuple[float, float]


class Tone(TypedDict):
    """A tone: the region of OKLCH color space to pick colors from."""

    #: OKLCH lightness range, 0 (black) to 1 (white)
    lightness: Range
    #: OKLCH chroma range, 0 (grey) to about 0.37
    chroma: Range
    #: Hue in degrees where chroma can reach the top of its range
    warm_hue: float
    #: How much the chroma range shrinks away from warm_hue: 0 gives the same range for all hues, 1 greys opposite warm_hue
    tilt: float


class PartialTone(TypedDict, total=False):
    """Tone fields over the base tone."""

    lightness: Range
    chroma: Range
    warm_hue: float
    tilt: float


ToneName = Literal["vivid", "bright", "strong", "deep", "dark", "soft", "pastel", "muted"]

#: A tone name, colors to infer the tone from, or tone fields over the base tone
ToneOption = Union[ToneName, Sequence[str], PartialTone]


def _tone(lightness: Range, chroma: Range, warm_hue: float, tilt: float) -> Tone:
    return {"lightness": lightness, "chroma": chroma, "warm_hue": warm_hue, "tilt": tilt}


#: Named tones, loosely after the PCCS tone system, but with narrower lightness ranges
#: so that no hue stands out. The sRGB gamut caps chroma below the range for some hues,
#: most for cyan and yellow in the colorful tones.
tones: dict[str, Tone] = {
    # The most colorful, close to the sRGB limit for many hues
    "vivid": _tone((0.55, 0.7), (0.15, 0.21), 285, 0),
    # Colorful and lighter than vivid, close to d3gl's module colors
    "bright": _tone((0.64, 0.76), (0.12, 0.17), 285, 0),
    # A step less colorful than vivid and a little lighter. The default
    "strong": _tone((0.58, 0.76), (0.11, 0.17), 285, 0),
    # As colorful as vivid but darker, for light backgrounds
    "deep": _tone((0.45, 0.62), (0.13, 0.2), 285, 0),
    # Darker and less colorful than deep
    "dark": _tone((0.36, 0.5), (0.06, 0.12), 285, 0),
    # Lighter and less colorful, close to the Englewood mural
    "soft": _tone((0.67, 0.83), (0.045, 0.135), 285, 0.15),
    # Light, for large areas or dark backgrounds
    "pastel": _tone((0.82, 0.92), (0.05, 0.1), 285, 0),
    # Greyish, so highlights stand out
    "muted": _tone((0.55, 0.75), (0.03, 0.08), 285, 0),
}

default_tone: Tone = tones["strong"]

_TONE_KEYS = frozenset(Tone.__annotations__)


def resolve_tone(tone: ToneOption | None, base: Tone = default_tone) -> Tone:
    """The tone a tone option gives: a named tone, the tone inferred from colors, or the given fields over the base tone."""
    if tone is None:
        return base
    if isinstance(tone, str):
        if tone not in tones:
            raise ValueError(f"Unknown tone: {tone}")
        return tones[tone]
    if isinstance(tone, Mapping):
        unknown = set(tone) - _TONE_KEYS
        if unknown:
            raise ValueError(f"Unknown tone fields: {', '.join(sorted(map(str, unknown)))}")
        return {
            "lightness": _given(tone, "lightness", base),
            "chroma": _given(tone, "chroma", base),
            "warm_hue": _given(tone, "warm_hue", base),
            "tilt": _given(tone, "tilt", base),
        }
    return infer_tone(tone)


def _given(tone: Mapping, key: str, base: Tone):
    value = tone.get(key)
    return base[key] if value is None else value  # type: ignore[literal-required]


def _lerp(r: Sequence[float], t: float) -> float:
    a, b = r
    return a + (b - a) * t


def tone_color(tone: Tone, hue: float, u: float, v: float) -> Lab:
    """Map hue (degrees) and u, v in [0, 1] to a color in the tone. u sets lightness, v chroma within the hue's chroma range."""
    chroma = tone["chroma"]
    tilt = tone["tilt"]
    warmth = (1 + math.cos(((hue - tone["warm_hue"]) * math.pi) / 180)) / 2
    scale = 1 - tilt + tilt * warmth
    L = _lerp(tone["lightness"], u)
    C = chroma[0] + (chroma[1] - chroma[0]) * v * scale
    return lch_to_lab(gamut_map((L, C, hue)))


_MIN_LIGHTNESS_SPAN = 0.1
_MIN_CHROMA_SPAN = 0.04


def _widen(lo_hi: Range, min_span: float, upper: float) -> Range:
    lo, hi = lo_hi
    pad = max(0, min_span - (hi - lo)) / 2
    return (max(0, lo - pad), min(upper, hi + pad))


def infer_tone(colors: Sequence[str]) -> Tone:
    """
    Infer a tone from example colors: the lightness and chroma ranges they span,
    and whether some hues are more saturated than others.
    """
    if isinstance(colors, str):
        raise TypeError("infer_tone takes a sequence of colors, not a single color")
    return infer_tone_lch([parse_oklch(c) for c in colors])


def infer_tone_lch(lch: Sequence[Lch]) -> Tone:
    if len(lch) == 0:
        return default_tone
    Ls = [c[0] for c in lch]
    Cs = [c[1] for c in lch]
    lightness = _widen((min(Ls), max(Ls)), _MIN_LIGHTNESS_SPAN, 1)
    chroma = _widen((min(Cs), max(Cs)), _MIN_CHROMA_SPAN, 0.37)

    # Least squares fit of C = a + b cos(H) + c sin(H).
    # The phase gives the most saturated hue, the amplitude the tilt.
    warm_hue, amplitude = _fit_chroma_by_hue(lch)
    # With chroma uniform under the cap, the cos amplitude is span * tilt / 4.
    # Use half of it: a few seeds overstate the tilt, and a full tilt
    # greys out the opposite hues so they become hard to tell apart.
    span = chroma[1] - chroma[0]
    tilt = 0 if len(lch) < 3 else min(1, (4 * amplitude) / span) / 2

    return {"lightness": lightness, "chroma": chroma, "warm_hue": warm_hue, "tilt": tilt}


def _fit_chroma_by_hue(lch: Sequence[Lch]) -> tuple[float, float]:
    S = [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]
    y = [0.0, 0.0, 0.0]
    for _, C, H in lch:
        h = (H * math.pi) / 180
        row = (1, math.cos(h), math.sin(h))
        for i in range(3):
            y[i] += row[i] * C
            for j in range(3):
                S[i][j] += row[i] * row[j]
    det = _determinant(S)
    if abs(det) < 1e-12:
        return 0, 0
    # Cramer's rule
    _, b, c = (
        _determinant([[y[i] if j == k else v for j, v in enumerate(row)] for i, row in enumerate(S)]) / det
        for k in range(3)
    )
    H = (math.atan2(c, b) * 180) / math.pi
    return (H + 360 if H < 0 else H), math.hypot(b, c)


def _determinant(m: list[list[float]]) -> float:
    a, b, c = m
    return a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])


def _mix(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _mix_angle(a: float, b: float, t: float) -> float:
    d = (b - a + 180) % 360 - 180  # shortest way around
    return (a + d * t) % 360


def mix_tone(a: Tone, b: Tone, t: float) -> Tone:
    """Interpolate between two tones, t = 0 gives a and t = 1 gives b."""
    if t <= 0:
        return a
    if t >= 1:
        return b
    return {
        "lightness": (_mix(a["lightness"][0], b["lightness"][0], t), _mix(a["lightness"][1], b["lightness"][1], t)),
        "chroma": (_mix(a["chroma"][0], b["chroma"][0], t), _mix(a["chroma"][1], b["chroma"][1], t)),
        "warm_hue": _mix_angle(a["warm_hue"], b["warm_hue"], t),
        "tilt": _mix(a["tilt"], b["tilt"], t),
    }


def zone_weight(i: int, midpoint: float, steepness: float) -> float:
    """
    How far color i (0-based) has moved from the top tone to the end tone.
    The first midpoint colors stay in the top tone; later colors move
    1 - (m / k)^steepness of the way, so an infinite steepness switches at once.
    """
    k = i + 1
    m = midpoint + 0.5
    if k < m:
        return 0
    if not math.isfinite(steepness):
        return 1
    return 1 - (m / k) ** steepness


_END_GAP = 0.03  # lightness between the top zone and the end zone
_END_SPAN = 0.22  # lightness span of the end zone
_DARKEST = 0.3  # below and above these, colors barely show their hue
_LIGHTEST = 0.95


def end_lightness(lightness: Range, direction: Literal["darker", "lighter"] = "darker") -> Range:
    """
    Lightness range for later colors: just below ("darker") or just above ("lighter")
    the given range, 0.03 apart from it and 0.22 wide, kept between 0.3 and 0.95.
    """
    L0, L1 = lightness
    if direction == "darker":
        hi = max(_DARKEST, L0 - _END_GAP)
        return (max(_DARKEST, hi - _END_SPAN), hi)
    lo = min(_LIGHTEST, L1 + _END_GAP)
    return (lo, min(_LIGHTEST, lo + _END_SPAN))
