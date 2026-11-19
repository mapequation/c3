"""Sequential scales through anchor colors, extended to darker and lighter shades."""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass

from ._oklab import Lab, color_to_oklab, gamut_map, lab_to_hex, lab_to_lch, lch_to_hex
from ._tone import Range

DEFAULT_LIGHTNESS: Range = (0.3, 0.95)
DEFAULT_END_CHROMA = 1.0
DEFAULT_END_HUE = 0.0

# Below this chroma an anchor's hue barely shows, so it takes the hue of a colorful anchor
_ACHROMATIC = 0.01

# More than any sRGB color's OKLCH chroma, for finding the most a lightness and hue can have
_MAX_CHROMA = 0.5

# Relative tolerance for comparing step sizes, so near-ties break the same in every language
_TIE = 1e-9


@dataclass
class _Knot:
    L: float
    S: float  # chroma relative to the most colorful color sRGB has at this lightness and hue
    H: float
    anchor: Lab | None = None
    C: float = 0.0


def _max_chroma(L: float, H: float) -> float:
    """The most chroma a color can have in sRGB at lightness L and hue H."""
    return gamut_map((L, _MAX_CHROMA, H))[1]


class Sequential:
    """
    A sequential scale from sequential(). Call it with t in [0, 1] for a hex color,
    from light to dark, or dark to light with reverse.
    """

    __slots__ = ("_knots", "_relative", "_hue", "_range", "_gaps", "_reverse")

    def __init__(self, knots: list[_Knot], L_range: Range, gaps: tuple[float, float], reverse: bool):
        self._knots = knots
        Ls = [k.L for k in knots]
        self._relative = _pchip(Ls, [k.S for k in knots])
        self._hue = _pchip(Ls, [k.H for k in knots])
        self._range = L_range
        self._gaps = gaps
        self._reverse = reverse

    def _color_at(self, L: float) -> str:
        for knot in self._knots:
            if knot.L == L:
                if knot.anchor is not None:
                    return lab_to_hex(knot.anchor)
                break
        H = self._hue(L)
        return lch_to_hex((L, self._relative(L) * _max_chroma(L, H), H))

    def __call__(self, t: float) -> str:
        if math.isnan(t):
            raise ValueError("t must be a number in [0, 1], got nan")
        u = min(1.0, max(0.0, t))
        L_min, L_max = self._range
        return self._color_at(L_min + (L_max - L_min) * u if self._reverse else L_max - (L_max - L_min) * u)

    def colors(self, n: int) -> list[str]:
        """
        n colors in the order of t, evenly spaced in lightness between the anchors and
        toward the ends. Every anchor is among them, so n must be at least the number of anchors.
        The ends are included unless the nearest anchor is within half a step of them.
        """
        anchors = [k.L for k in self._knots if k.anchor is not None]
        if isinstance(n, bool) or not isinstance(n, int) or n < 0:
            raise ValueError(f"n must be a whole number of at least 0, got {n}")
        if n == 0:
            return []
        if n < len(anchors):
            raise ValueError(f"colors(n) includes every anchor, so n must be at least {len(anchors)}, got {n}")
        hex_colors = [self._color_at(L) for L in _steps(anchors, *self._gaps, n)]
        return hex_colors if self._reverse else hex_colors[::-1]

    def __repr__(self) -> str:
        anchors = ", ".join(lab_to_hex(k.anchor) for k in self._knots if k.anchor is not None)
        return f"Sequential({anchors})"


def sequential(
    colors: str | Sequence[str | Sequence[float]],
    *,
    lightness: Sequence[float] = DEFAULT_LIGHTNESS,
    light_chroma: float = DEFAULT_END_CHROMA,
    dark_chroma: float = DEFAULT_END_CHROMA,
    light_hue: float = DEFAULT_END_HUE,
    dark_hue: float = DEFAULT_END_HUE,
    reverse: bool = False,
) -> Sequential:
    """
    A sequential scale through one or more anchor colors, extended to darker and lighter shades.

    The anchors are sorted by lightness. Lightness changes linearly with t, from the light end
    to the dark end, and hue and chroma follow smooth curves through the anchors. Chroma is
    relative to the most colorful color sRGB has at each lightness and hue, so the scale stays
    as colorful as the anchors where sRGB allows it, and fades toward black and white.

    Args:
        colors: One or more anchor colors with different lightness: CSS colors, or (r, g, b) floats in [0, 1].
        lightness: OKLCH lightness of the dark and light ends, (min, max). Widened to include every anchor.
        light_chroma: Chroma at the light end, as a fraction of the lightest anchor's, both relative to the
            most colorful color sRGB has at that lightness and hue. At 1 the end is as colorful as the
            anchor for its lightness, which fades toward white.
        dark_chroma: Chroma at the dark end, as a fraction of the darkest anchor's, like light_chroma.
        light_hue: Degrees the hue turns from the lightest anchor to the light end.
        dark_hue: Degrees the hue turns from the darkest anchor to the dark end.
        reverse: Go from dark (t = 0) to light (t = 1) instead of from light to dark.

    Returns:
        A callable from t in [0, 1] to a hex color, with colors(n) for n steps.
    """
    lo, hi = (float(x) for x in lightness)
    if not (lo >= 0 and hi <= 1 and lo < hi):
        raise ValueError(f"lightness must be [min, max] with 0 <= min < max <= 1, got [{lo}, {hi}]")
    for name, value in {"light_chroma": light_chroma, "dark_chroma": dark_chroma}.items():
        if not (value >= 0 and math.isfinite(value)):
            raise ValueError(f"{name} must be finite and at least 0, got {value}")
    for name, value in {"light_hue": light_hue, "dark_hue": dark_hue}.items():
        if not math.isfinite(value):
            raise ValueError(f"{name} must be finite, got {value}")

    knots = _anchor_knots([colors] if isinstance(colors, str) else list(colors))
    darkest, lightest = knots[0], knots[-1]
    L_min = min(lo, darkest.L)
    L_max = max(hi, lightest.L)
    # Gaps from the outermost anchors to the ends; an anchor at or beyond an end is the end
    dark_gap = darkest.L - L_min
    light_gap = L_max - lightest.L
    if dark_gap > 0:
        knots.insert(0, _Knot(L_min, float(dark_chroma) * darkest.S, darkest.H + float(dark_hue)))
    if light_gap > 0:
        knots.append(_Knot(L_max, float(light_chroma) * lightest.S, lightest.H + float(light_hue)))
    return Sequential(knots, (L_min, L_max), (dark_gap, light_gap), bool(reverse))


def _anchor_knots(colors: list) -> list[_Knot]:
    """The anchors sorted by lightness, with greys taking the hue of the nearest colorful anchor below or above."""
    if len(colors) == 0:
        raise ValueError("sequential() needs at least one color")
    knots = []
    for color in colors:
        anchor = color_to_oklab(color)
        L, C, H = lab_to_lch(anchor)
        max_chroma = _max_chroma(L, H)
        knots.append(_Knot(L, min(1.0, C / max_chroma) if max_chroma > 0 else 0.0, H, anchor, C))
    knots.sort(key=lambda k: k.L)
    for a, b in zip(knots, knots[1:]):
        if a.L == b.L:
            raise ValueError("The colors of a sequential scale need different lightness")

    colorful = [k for k in knots if k.C >= _ACHROMATIC]
    previous = colorful[0].H if colorful else 0.0
    for knot in knots:
        if knot.C >= _ACHROMATIC:
            previous = knot.H
        else:
            knot.H = previous

    # Unwrap hues so that consecutive anchors take the shortest way around the hue circle,
    # with the same steps as JS, where % keeps the sign
    for a, b in zip(knots, knots[1:]):
        d = math.fmod(math.fmod(b.H - a.H, 360) + 540, 360) - 180
        b.H = a.H + d
    return knots


@dataclass
class _Gap:
    start: float
    size: float
    count: int
    outer: int  # -1 toward the dark end, 1 toward the light end, 0 between anchors


def _spacing(gap: _Gap) -> float:
    # An empty gap to an end counts as twice its size, so it gets a step once that is more than half a step
    return 2 * gap.size if gap.count == 0 else gap.size / gap.count


def _steps(anchors: list[float], dark_gap: float, light_gap: float, n: int) -> list[float]:
    """
    Lightness of n steps from dark to light that include every anchor. Each gap between
    anchors is split evenly; the gaps to the ends hold steps only when they are larger
    than half a step. The next step goes where the steps are farthest apart.
    """
    gaps: list[_Gap] = []
    if dark_gap > 0:
        gaps.append(_Gap(anchors[0], dark_gap, 0, -1))
    for a, b in zip(anchors, anchors[1:]):
        gaps.append(_Gap(a, b - a, 1, 0))
    if light_gap > 0:
        gaps.append(_Gap(anchors[-1], light_gap, 0, 1))

    for _ in range(n - len(anchors)):
        best = gaps[0]
        for gap in gaps:
            if _spacing(gap) > _spacing(best) * (1 + _TIE):
                best = gap
        best.count += 1

    Ls: list[float] = []
    for gap in gaps:
        if gap.outer == -1:
            # From the dark end up to the darkest anchor
            Ls.extend(gap.start - (gap.size * j) / gap.count for j in range(gap.count, 0, -1))
        elif gap.outer == 0:
            Ls.extend(gap.start + (gap.size * j) / gap.count for j in range(gap.count))
        else:
            Ls.append(gap.start)
            Ls.extend(gap.start + (gap.size * j) / gap.count for j in range(1, gap.count + 1))
    if all(gap.outer != 1 for gap in gaps):
        Ls.append(anchors[-1])
    return Ls


def _sign(x: float) -> int:
    return (x > 0) - (x < 0)


def _edge_slope(h0: float, h1: float, d0: float, d1: float) -> float:
    """The slope at an end: a three-point estimate, kept from overshooting."""
    d = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1)
    if _sign(d) != _sign(d0):
        return 0.0
    if _sign(d0) != _sign(d1) and abs(d) > 3 * abs(d0):
        return 3 * d0
    return d


def _pchip(xs: list[float], ys: list[float]):
    """
    Monotone cubic interpolation through the points (xs, ys), with xs increasing,
    after Fritsch and Carlson: no overshoot, and flat at every local extremum.
    """
    m = len(xs)
    h = [xs[k + 1] - xs[k] for k in range(m - 1)]
    delta = [(ys[k + 1] - ys[k]) / h[k] for k in range(m - 1)]

    def slope(k: int) -> float:
        if m == 2:
            return delta[0]
        if k == 0:
            return _edge_slope(h[0], h[1], delta[0], delta[1])
        if k == m - 1:
            return _edge_slope(h[m - 2], h[m - 3], delta[m - 2], delta[m - 3])
        d0, d1 = delta[k - 1], delta[k]
        if d0 * d1 <= 0:
            return 0.0
        w1 = 2 * h[k] + h[k - 1]
        w2 = h[k] + 2 * h[k - 1]
        return (w1 + w2) / (w1 / d0 + w2 / d1)

    slopes = [slope(k) for k in range(m)]

    def at(x: float) -> float:
        k = 0
        while k < m - 2 and x > xs[k + 1]:
            k += 1
        s = (x - xs[k]) / h[k]
        r = 1 - s
        return (
            (1 + 2 * s) * r * r * ys[k]
            + s * r * r * h[k] * slopes[k]
            + s * s * (3 - 2 * s) * ys[k + 1]
            - s * s * r * h[k] * slopes[k + 1]
        )

    return at
