"""Sequential scales through seed colors, extended to darker and lighter shades."""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Callable, Literal

from ._oklab import Lab, color_to_oklab, gamut_map, lab_to_hex, lab_to_lch, lch_to_hex
from ._palette import HueSource, _is_oklch, palette
from ._schemes import Scheme, get_scheme
from ._tone import Range, ToneOption

DEFAULT_LIGHTNESS: Range = (0.3, 0.95)
DEFAULT_END_CHROMA = 1.0
DEFAULT_END_HUE = 0.0

#: How a sequential scale goes from one seed to the next
SequentialPath = Literal["relative", "straight"]

# Below this chroma an anchor's hue barely shows, so it takes the hue of a colorful anchor
_ACHROMATIC = 0.01

# More than any sRGB color's OKLCH chroma, for finding the most a lightness and hue can have
_MAX_CHROMA = 0.5

# Relative tolerance for comparing step sizes, so near-ties break the same in every language
_TIE = 1e-9

# Places a scheme is read at, one per color of d3's 256-color schemes
_SCHEME_STEPS = 256

# How far a scheme's lightness may turn back, from rounding to 8-bit colors, and still count as one way
_SCHEME_WOBBLE = 0.02


@dataclass
class _Knot:
    L: float
    S: float  # chroma relative to the most colorful color sRGB has at this lightness and hue
    H: float
    anchor: Lab | None = None
    C: float = 0.0


def _polar(knots: list[_Knot]) -> Callable[[float], str]:
    """
    Colors through the knots by lightness, with hue and chroma relative to the most sRGB has
    on smooth curves through them.
    """
    Ls = [k.L for k in knots]
    relative = _pchip(Ls, [k.S for k in knots])
    hue = _pchip(Ls, [k.H for k in knots])

    def color(L: float) -> str:
        H = hue(L)
        return lch_to_hex((L, relative(L) * _max_chroma(L, H), H))

    return color


def _segment(anchors: list[_Knot], L: float) -> tuple[_Knot, _Knot, float]:
    """The anchors on either side of lightness L, and how far L is from the first to the second."""
    k = 0
    while k < len(anchors) - 2 and L > anchors[k + 1].L:
        k += 1
    a, b = anchors[k], anchors[k + 1]
    return a, b, (L - a.L) / (b.L - a.L)


def _straight_between(anchors: list[_Knot], L: float) -> str:
    """The color at lightness L on the straight line in OKLab between the anchors on either side of it."""
    a, b, s = _segment(anchors, L)
    _, a0, b0 = a.anchor  # type: ignore[misc]
    _, a1, b1 = b.anchor  # type: ignore[misc]
    return lch_to_hex(lab_to_lch((L, a0 + s * (a1 - a0), b0 + s * (b1 - b0))))


def _relative_between(anchors: list[_Knot], L: float) -> str:
    """
    The color at lightness L on the straight line between the anchors on either side of it, on a hue
    circle where each anchor sits at its own hue and its share of the most chroma sRGB has.
    """
    a, b, s = _segment(anchors, L)
    x0, y0 = _share_point(a)
    x1, y1 = _share_point(b)
    x = x0 + s * (x1 - x0)
    y = y0 + s * (y1 - y0)
    H = math.atan2(y, x) * 180 / math.pi
    return lch_to_hex((L, math.hypot(x, y) * _max_chroma(L, H), H))


def _share_point(knot: _Knot) -> tuple[float, float]:
    """An anchor at its share of the most chroma sRGB has, at its own hue rather than one it took from another."""
    h = lab_to_lch(knot.anchor)[2] * math.pi / 180  # type: ignore[arg-type]
    return knot.S * math.cos(h), knot.S * math.sin(h)


def _max_chroma(L: float, H: float) -> float:
    """The most chroma a color can have in sRGB at lightness L and hue H."""
    return gamut_map((L, _MAX_CHROMA, H))[1]


class Sequential:
    """
    A sequential scale from sequential(). Call it with t in [0, 1] for a hex color,
    from light to dark, or dark to light with reverse.
    """

    __slots__ = ("_knots", "_anchors", "_curved", "_dark", "_light", "_between", "_range", "_gaps", "_reverse")

    def __init__(
        self, knots: list[_Knot], L_range: Range, gaps: tuple[float, float], reverse: bool, path: SequentialPath
    ):
        self._knots = knots
        self._anchors = [k for k in knots if k.anchor is not None]
        # With one anchor, smooth curves from end to end through it; with more, each end follows only its
        # outermost anchor
        several = len(self._anchors) > 1
        self._curved = _polar(knots)
        self._dark = _polar(knots[:2]) if several and gaps[0] > 0 else self._curved
        self._light = _polar(knots[-2:]) if several and gaps[1] > 0 else self._curved
        self._between = _straight_between if path == "straight" else _relative_between
        self._range = L_range
        self._gaps = gaps
        self._reverse = reverse

    def _color_at(self, L: float) -> str:
        for knot in self._knots:
            if knot.L == L:
                if knot.anchor is not None:
                    return lab_to_hex(knot.anchor)
                break
        if L < self._anchors[0].L:
            return self._dark(L)
        if L > self._anchors[-1].L:
            return self._light(L)
        return self._between(self._anchors, L)

    def __call__(self, t: float) -> str:
        if math.isnan(t):
            raise ValueError("t must be a number in [0, 1], got nan")
        u = min(1.0, max(0.0, t))
        L_min, L_max = self._range
        return self._color_at(L_min + (L_max - L_min) * u if self._reverse else L_max - (L_max - L_min) * u)

    def colors(self, n: int) -> list[str]:
        """
        n colors in the order of t, evenly spaced in lightness between the seeds and
        toward the ends. Every seed is among them, so n must be at least the number of seeds.
        The ends are included unless the nearest seed is within half a step of them.
        """
        anchors = [k.L for k in self._anchors]
        if isinstance(n, bool) or not isinstance(n, int) or n < 0:
            raise ValueError(f"n must be a whole number of at least 0, got {n}")
        if n == 0:
            return []
        if n < len(anchors):
            raise ValueError(f"colors(n) includes every seed, so n must be at least {len(anchors)}, got {n}")
        hex_colors = [self._color_at(L) for L in _steps(anchors, *self._gaps, n)]
        return hex_colors if self._reverse else hex_colors[::-1]

    def __repr__(self) -> str:
        anchors = ", ".join(lab_to_hex(k.anchor) for k in self._knots if k.anchor is not None)
        return f"Sequential({anchors})"


@dataclass
class _SharePoint:
    """A color's lightness, and its share of the most chroma sRGB has as a point on the hue circle."""

    L: float
    x: float
    y: float


def _scheme_points(hue: str | Scheme) -> list[_SharePoint]:
    """
    A scheme's colors from dark to light as share points, read at evenly spaced places,
    with lightness that never goes down. Raises if the scheme's lightness goes up and down,
    or doesn't change.
    """
    scheme = get_scheme(hue)
    points = []
    for i in range(_SCHEME_STEPS):
        L, C, H = lab_to_lch(color_to_oklab(scheme(i / (_SCHEME_STEPS - 1))))
        max_chroma = _max_chroma(L, H)
        S = min(1.0, C / max_chroma) if max_chroma > 0 else 0.0
        h = H * math.pi / 180
        points.append(_SharePoint(L, S * math.cos(h), S * math.sin(h)))
    if points[0].L > points[-1].L:
        points.reverse()

    name = hue if isinstance(hue, str) else "The scheme"
    top = points[0].L
    for point in points:
        if point.L < top - _SCHEME_WOBBLE:
            raise ValueError(f"{name} isn't sequential: its lightness goes up and down")
        top = max(top, point.L)
        point.L = top
    if not top > points[0].L:
        raise ValueError(f"{name} isn't sequential: its lightness doesn't change")
    return points


class _SchemeSequential(Sequential):
    """
    A sequential scale that follows a scheme by lightness, stretched to the lightness range, with each
    color's share of the most chroma sRGB has scaled and its hue turned, evenly from the dark end to the light end.
    """

    __slots__ = ("_points", "_ends", "_name")

    def __init__(
        self,
        points: list[_SharePoint],
        L_range: Range,
        ends: tuple[float, float, float, float],
        reverse: bool,
        name: str,
    ):
        self._points = points
        self._range = L_range
        self._ends = ends  # light chroma, dark chroma, light hue, dark hue
        self._reverse = reverse
        self._name = name

    def _color_at(self, L: float) -> str:
        points = self._points
        light_chroma, dark_chroma, light_hue, dark_hue = self._ends
        lo, hi = self._range
        darkest, lightest = points[0].L, points[-1].L
        # From the dark end (0) to the light end (1), and the scheme's own lightness there
        u = (L - lo) / (hi - lo)
        source = darkest + u * (lightest - darkest)
        k = 1
        while k < len(points) - 1 and points[k].L < source:
            k += 1
        p, q = points[k - 1], points[k]
        s = min(1.0, max(0.0, (source - p.L) / (q.L - p.L))) if q.L > p.L else 0.0
        x = p.x + s * (q.x - p.x)
        y = p.y + s * (q.y - p.y)
        H = math.atan2(y, x) * 180 / math.pi + dark_hue + u * (light_hue - dark_hue)
        share = (dark_chroma + u * (light_chroma - dark_chroma)) * math.hypot(x, y)
        return lch_to_hex((L, share * _max_chroma(L, H), H))

    def colors(self, n: int) -> list[str]:
        """n colors evenly spaced from end to end, in the order of t, or the middle for one."""
        if isinstance(n, bool) or not isinstance(n, int) or n < 0:
            raise ValueError(f"n must be a whole number of at least 0, got {n}")
        if n == 1:
            return [self(0.5)]
        return [self(i / (n - 1)) for i in range(n)]

    def __repr__(self) -> str:
        return f"Sequential({self._name})"


def sequential(
    *,
    seeds: Sequence[str | Sequence[float]] = (),
    tone: ToneOption | None = None,
    hue: HueSource = "Oklch",
    offset: float | None = None,
    lightness: Sequence[float] | None = None,
    light_chroma: float = DEFAULT_END_CHROMA,
    dark_chroma: float = DEFAULT_END_CHROMA,
    light_hue: float = DEFAULT_END_HUE,
    dark_hue: float = DEFAULT_END_HUE,
    reverse: bool = False,
    path: SequentialPath = "relative",
) -> Sequential:
    """
    A sequential scale through one or more seed colors, extended to darker and lighter shades.

    The seeds, called anchors below, are sorted by lightness. Lightness changes linearly with t, from the light end
    to the dark end. Chroma is relative to the most colorful color sRGB has at each lightness and hue, so the
    scale stays as colorful as the anchors where sRGB allows it, and fades toward black and white. Between
    anchors the scale goes in a straight line across the hue circle in those terms, or through OKLab with
    path="straight"; toward the ends hue and chroma follow smooth curves from the outermost anchors.

    Without seeds, a scheme given as hue is followed instead: by default the scale has the scheme's colors, from
    light to dark, evenly spaced in lightness. The lightness range stretches the scheme, keeping each color's hue
    and chroma relative to the sRGB limit, and the chroma and hue at the ends scale chroma and turn hue, changing
    evenly from one end to the other.

    Args:
        seeds: Colors the scale goes through, with different lightness: CSS colors, or (r, g, b) floats
            in [0, 1]. Without seeds, the scale follows the scheme given as hue, or goes through the first
            color of palette() with the same tone and offset.
        tone: Lightness and chroma of the color the scale goes through without seeds or a scheme, as in palette().
        hue: Without seeds, a scheme for a scale that follows it: a d3 scheme name like "Viridis" or "Blues",
            or a callable from t in [0, 1] to a color, like matplotlib.colormaps["magma"]. Or "Oklch" (default)
            for a scale through the first color of palette(). The scheme's lightness must go one way, from light
            to dark or dark to light, so not "Turbo", "Rainbow", "Sinebow" or a diverging scheme like "RdBu".
        offset: Where on the OKLCH hue circle the color sits without seeds or a scheme, as in palette().
            Default 245 (blue).
        lightness: OKLCH lightness of the dark and light ends, (min, max). Default (0.3, 0.95), widened to
            include every seed. With a scheme, the scheme's own by default, and the scheme is stretched to
            fit one you give.
        light_chroma: Chroma at the light end, as a fraction of the lightest seed's, both relative to the
            most colorful color sRGB has at that lightness and hue. At 1 the end is as colorful as the
            seed for its lightness, which fades toward white. With a scheme, a fraction of the scheme's own
            chroma, changing evenly from dark_chroma at the dark end.
        dark_chroma: Chroma at the dark end, as a fraction of the darkest seed's, like light_chroma.
        light_hue: Degrees the hue turns from the lightest seed to the light end. With a scheme, degrees the
            scheme's hue turns at the light end, changing evenly from dark_hue at the dark end.
        dark_hue: Degrees the hue turns from the darkest seed to the dark end, like light_hue.
        reverse: Go from dark (t = 0) to light (t = 1) instead of from light to dark.
        path: How the scale goes from one seed to the next. "relative" goes in a straight line across the hue
            circle with each seed at its share of the most chroma sRGB has: seeds of similar hue keep their
            share, so the scale is as colorful as they are where sRGB allows it, and seeds of very different
            hue, like blue and orange, meet in a greyish color. "straight" goes in a straight line through
            OKLab, so no color between two seeds is more colorful than they are, and next to a near-white seed
            the colors are pale. The ends follow the outermost seeds either way. Not used with a scheme.

    Returns:
        A callable from t in [0, 1] to a hex color, with colors(n) for n steps.
    """
    lo, hi = (float(x) for x in (DEFAULT_LIGHTNESS if lightness is None else lightness))
    if not (lo >= 0 and hi <= 1 and lo < hi):
        raise ValueError(f"lightness must be [min, max] with 0 <= min < max <= 1, got [{lo}, {hi}]")
    for name, value in {"light_chroma": light_chroma, "dark_chroma": dark_chroma}.items():
        if not (value >= 0 and math.isfinite(value)):
            raise ValueError(f"{name} must be finite and at least 0, got {value}")
    for name, value in {"light_hue": light_hue, "dark_hue": dark_hue}.items():
        if not math.isfinite(value):
            raise ValueError(f"{name} must be finite, got {value}")
    if path not in ("relative", "straight"):
        raise ValueError(f'Unknown path: {path!r}, use "relative" or "straight"')

    if isinstance(seeds, str):
        raise TypeError("seeds takes a sequence of colors, not a single color")
    if len(seeds) == 0 and not _is_oklch(hue):
        points = _scheme_points(hue)
        L_range = (points[0].L, points[-1].L) if lightness is None else (lo, hi)
        ends = (float(light_chroma), float(dark_chroma), float(light_hue), float(dark_hue))
        name = hue if isinstance(hue, str) else getattr(hue, "name", "scheme")
        return _SchemeSequential(points, L_range, ends, bool(reverse), name)
    # Without seeds, the first color palette() would give
    knots = _anchor_knots(list(seeds) if len(seeds) > 0 else palette(1, tone=tone, hue=hue, offset=offset))
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
    return Sequential(knots, (L_min, L_max), (dark_gap, light_gap), bool(reverse), path)


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
