"""Categorical colors spread over hue, lightness and chroma in OKLCH."""

from __future__ import annotations

import math
import numbers
from collections.abc import Callable, Mapping, Sequence
from typing import Literal, TypedDict, Union

from ._oklab import (
    Lab,
    color_to_oklab,
    lab_distance,
    lab_to_hex,
    lab_to_lch,
    parse_oklab,
)
from ._schemes import Scheme, SchemeName, get_scheme
from ._select import farthest
from ._select import lookahead as lookahead_select
from ._stops import stops, van_der_corput
from ._tone import (
    Range,
    Tone,
    ToneOption,
    default_tone,
    end_lightness,
    infer_tone,
    infer_tone_lch,
    mix_tone,
    resolve_tone,
    tone_color,
    zone_weight,
)

#: How the next color is chosen from the palette's sequence of colors:
#: "sequence" the next one, "farthest" the one farthest from all colors so far among the
#: first `candidates`, "lookahead" the farthest among the next `lookahead`
Method = Literal["sequence", "farthest", "lookahead"]

#: Where hues come from: "Oklch" for the OKLCH hue circle, a named d3 scheme, or any callable scheme
HueSource = Union[Literal["Oklch"], SchemeName, Scheme]


class EndZone(TypedDict, total=False):
    """An end zone for later colors, so they don't compete with the first ones."""

    #: "darker" or "lighter" than the tone's lightness range, or an OKLCH lightness range (min, max)
    lightness: Literal["darker", "lighter"] | Range
    #: Number of colors before the end zone, or "auto" for as many as fit min_gap apart
    midpoint: float | Literal["auto"]
    #: Smallest OKLab distance between colors before the end zone when midpoint is "auto"
    min_gap: float
    #: With the "sequence" method, fade into the end zone: a color k times the midpoint moves
    #: 1 - 1/k^steepness of the way. math.inf switches at once.
    steepness: float


EndOption = Union[EndZone, Literal["darker", "lighter"], Range, Literal[False], None]

DEFAULT_OFFSET = 245  # on "Oklch"; a scheme starts at 0
DEFAULT_CANDIDATES = 4096
DEFAULT_LOOKAHEAD = 64
DEFAULT_LIGHTNESS_OFFSET = 7
DEFAULT_CHROMA_OFFSET = 4

default_end_zone: EndZone = {"lightness": "darker", "midpoint": "auto", "min_gap": 0.04, "steepness": math.inf}

_END_KEYS = frozenset(EndZone.__annotations__)

# Upper bound on the automatic top zone, so a tiny min_gap can't make it quadratic in n
_MAX_AUTO_MIDPOINT = 1024


def default_offset(hue: HueSource) -> float:
    """Where the first color sits by default: blue on the hue circle, the start of a scheme."""
    return DEFAULT_OFFSET if _is_oklch(hue) else 0


def _is_oklch(hue: object) -> bool:
    return isinstance(hue, str) and hue == "Oklch"


def end_zone(end: EndOption = False) -> EndZone | None:
    """The end zone options with defaults filled in, or None for no end zone."""
    if end is None or end is False:
        return None
    if end is True:
        return dict(default_end_zone)  # type: ignore[return-value]
    if isinstance(end, str) or not isinstance(end, Mapping):
        return {**default_end_zone, "lightness": end}  # type: ignore[typeddict-item]
    unknown = set(end) - _END_KEYS
    if unknown:
        raise ValueError(f"Unknown end zone fields: {', '.join(sorted(map(str, unknown)))}")
    return {
        key: default_end_zone[key] if end.get(key) is None else end[key]  # type: ignore[literal-required]
        for key in ("lightness", "midpoint", "min_gap", "steepness")
    }  # type: ignore[return-value]


class _Options:
    """palette() options with their defaults filled in."""

    def __init__(
        self,
        tone: ToneOption | None = None,
        hue: HueSource | None = None,
        offset: float | None = None,
        reverse: bool | None = None,
        seeds: Sequence[str] | None = None,
        method: Method | None = None,
        candidates: int | None = None,
        lookahead: int | None = None,
        lightness_offset: float | None = None,
        chroma_offset: float | None = None,
        end: EndOption = None,
    ):
        if isinstance(seeds, str):
            raise TypeError("seeds takes a sequence of colors, not a single color")
        self.tone = tone
        self.hue: HueSource = "Oklch" if hue is None else hue
        self.offset = default_offset(self.hue) if offset is None else offset
        self.reverse = False if reverse is None else reverse
        self.seeds: Sequence[str] = () if seeds is None else seeds
        self.method: Method = method if method is not None else ("farthest" if len(self.seeds) > 0 else "sequence")
        if self.method not in ("sequence", "farthest", "lookahead"):
            raise ValueError(f'Unknown method: {self.method!r}, use "sequence", "farthest" or "lookahead"')
        self.candidates = DEFAULT_CANDIDATES if candidates is None else candidates
        self.lookahead = DEFAULT_LOOKAHEAD if lookahead is None else lookahead
        self.lightness_offset = DEFAULT_LIGHTNESS_OFFSET if lightness_offset is None else lightness_offset
        self.chroma_offset = DEFAULT_CHROMA_OFFSET if chroma_offset is None else chroma_offset
        self.end = end


def palette(
    n: int | Sequence[float] = 16,
    *,
    tone: ToneOption | None = None,
    hue: HueSource = "Oklch",
    offset: float | None = None,
    reverse: bool = False,
    seeds: Sequence[str] = (),
    method: Method | None = None,
    candidates: int = DEFAULT_CANDIDATES,
    lookahead: int = DEFAULT_LOOKAHEAD,
    lightness_offset: float = DEFAULT_LIGHTNESS_OFFSET,
    chroma_offset: float = DEFAULT_CHROMA_OFFSET,
    end: EndOption = False,
) -> list[str]:
    """
    Generate categorical colors spread over hue, lightness and chroma in OKLCH.

    The colors come from a sequence: hue from the Cantor stops (base 2), lightness from a
    base-3 and chroma from a base-5 van der Corput sequence, together a Halton sequence.
    The first colors come from the tone; later colors move to the end zone, if any.

    :param n: Number of colors, including seeds, or weights for the "sequence" method
    :param tone: A tone name like "strong" or "pastel", colors to infer the tone from, or tone
        fields over the base tone. The base tone is inferred from seeds, else from a scheme's
        colors (with the default lightness), else the default "strong".
    :param hue: "Oklch" for the OKLCH hue circle, "Turbo", "Sinebow" or "Rainbow", or any
        callable from t in [0, 1] to a CSS color string or (r, g, b[, a]) floats in [0, 1]
    :param offset: Where on the hue source the first color sits, in degrees: its hue on "Oklch",
        and on a scheme, 360 is the whole scheme. Default 245 (blue) on "Oklch" and 0 on a scheme.
    :param reverse: Go around the hue circle toward higher hues, or read the scheme from 1 to 0
    :param seeds: Colors to start the palette with, any CSS colors
    :param method: "sequence", "farthest" or "lookahead"; "farthest" by default with seeds
    :param candidates: Number of sequence colors "farthest" chooses from
    :param lookahead: Number of upcoming sequence colors "lookahead" chooses from
    :param lightness_offset: Start index in the base-3 sequence that sets lightness
    :param chroma_offset: Start index in the base-5 sequence that sets chroma
    :param end: An end zone for later colors: its lightness ("darker", "lighter" or a range),
        an EndZone dict, or False for none
    :returns: hex colors
    """
    options = _Options(
        tone=tone,
        hue=hue,
        offset=offset,
        reverse=reverse,
        seeds=seeds,
        method=method,
        candidates=candidates,
        lookahead=lookahead,
        lightness_offset=lightness_offset,
        chroma_offset=chroma_offset,
        end=end,
    )
    return _palette(n, options)


def _palette(n: int | Sequence[float], options: _Options) -> list[str]:
    if options.method == "sequence" and len(options.seeds) > 0:
        raise ValueError('Seeds need the "farthest" or "lookahead" method')
    if options.method == "sequence":
        return _sequence(n, options)
    count = n if isinstance(n, numbers.Real) else len(n)
    return _choose(count, options.method, options)


def _positions(count: int | Sequence[float]) -> list[float]:
    return [interval.start for interval in stops(count)]


def _sequence(n: int | Sequence[float], options: _Options) -> list[str]:
    """The colors of the sequence in order, moving to the end zone after the midpoint."""
    zone = end_zone(options.end)
    top, bottom = palette_tones(options)
    at = _sequence_color(options)
    is_count = isinstance(n, numbers.Real)
    if not is_count:
        n = list(n)  # type: ignore[arg-type]

    positions = _positions(n)
    first = [at(i, top, position) for i, position in enumerate(positions)]
    if zone is None:
        return [lab_to_hex(lab) for lab in first]

    midpoint = zone["midpoint"]
    steepness = zone["steepness"]
    m = midpoint if isinstance(midpoint, numbers.Real) else 0
    if midpoint == "auto":
        # The top zone must not depend on n, so look past the n colors when needed.
        # Stops for a count never move when there are more of them.
        limit = _MAX_AUTO_MIDPOINT if is_count else min(len(n), _MAX_AUTO_MIDPOINT)  # type: ignore[arg-type]
        search = _positions(limit) if is_count and n < limit else positions  # type: ignore[operator]
        m = _fit_count(
            lambda i: first[i] if i < len(first) else at(i, top, search[i]),
            limit,
            zone["min_gap"],
        )

    result = []
    for i, lab in enumerate(first):
        t = zone_weight(i, m, steepness)
        result.append(lab_to_hex(lab if t == 0 else at(i, mix_tone(top, bottom, t), positions[i])))
    return result


def _choose(n: float, method: Method, options: _Options) -> list[str]:
    """Seeds first, then colors chosen from the sequence by distance; the end zone starts at once."""
    candidates = options.candidates
    window = options.lookahead
    if method == "farthest" and candidates < 1:
        raise ValueError(f"candidates must be at least 1, got {candidates}")
    if method == "lookahead" and window < 1:
        raise ValueError(f"lookahead must be at least 1, got {window}")
    total = max(0, n)
    zone = end_zone(options.end)
    top, bottom = palette_tones(options)
    at = _sequence_color(options)
    seeded = [parse_oklab(seed) for seed in options.seeds]

    def pick(picked: list[Lab], count: float, tone: Tone, stop_below: float = 0) -> list[Lab]:
        if method == "farthest":
            return farthest(picked, count, [at(i, tone) for i in range(int(candidates))], stop_below)
        return lookahead_select(picked, count, lambda i: at(i, tone), window, stop_below)

    if zone is None:
        colors = seeded + pick(seeded, total - len(seeded), top)
        return [lab_to_hex(lab) for lab in colors[: int(total)]]

    # Top zone: up to midpoint colors, or until a new color would be closer than min_gap
    midpoint = zone["midpoint"]
    auto = midpoint == "auto"
    top_size = total if auto else min(total, midpoint)  # type: ignore[type-var]
    first = seeded + pick(seeded, top_size - len(seeded), top, zone["min_gap"] if auto else 0)
    rest = pick(first, total - len(first), bottom)
    return [lab_to_hex(lab) for lab in (first + rest)[: int(total)]]


def _sequence_color(options: _Options) -> Callable[..., Lab]:
    """
    The i:th color of the sequence in a tone. For a count, the Cantor stop
    is the base-2 van der Corput value, which is the default position.
    """
    hue_at = _hue_source(options.hue, options.offset, options.reverse)
    lightness_offset = options.lightness_offset
    chroma_offset = options.chroma_offset

    def at(i: int, tone: Tone, position: float | None = None) -> Lab:
        if position is None:
            position = van_der_corput(i, 2)
        return tone_color(
            tone,
            hue_at(position),
            van_der_corput(i + lightness_offset, 3),
            van_der_corput(i + chroma_offset, 5),
        )

    return at


def palette_tones(options: _Options) -> tuple[Tone, Tone]:
    """
    The tones palette() picks from: the top tone for the first colors and the
    end zone tone for later ones (the top tone if there is no end zone).
    """
    if len(options.seeds) > 0:
        base = infer_tone(options.seeds)
    elif _is_oklch(options.hue):
        base = default_tone
    else:
        base = scheme_tone(options.hue)
    top = resolve_tone(options.tone, base)
    zone = end_zone(options.end)
    if zone is None:
        return top, top
    lightness = zone["lightness"]
    if isinstance(lightness, str):
        if lightness not in ("darker", "lighter"):
            raise ValueError(f'Unknown end zone lightness: {lightness!r}, use "darker", "lighter" or a range')
        lightness = end_lightness(top["lightness"], lightness)  # type: ignore[arg-type]
    return top, {**top, "lightness": lightness}


_SCHEME_SAMPLES = 32
_SCHEME_TRIM = 0.05


def scheme_tone(scheme: SchemeName | Scheme) -> Tone:
    """
    The tone palette(hue=scheme) uses: chroma, warm hue and tilt from the
    center 90% of the scheme, where the ends of many schemes stick out, and the
    default lightness, so the first colors have similar lightness.
    """
    interpolate = get_scheme(scheme)
    samples = [
        lab_to_lch(color_to_oklab(interpolate(_SCHEME_TRIM + ((1 - 2 * _SCHEME_TRIM) * (i + 0.5)) / _SCHEME_SAMPLES)))
        for i in range(_SCHEME_SAMPLES)
    ]
    return {**infer_tone_lch(samples), "lightness": default_tone["lightness"]}


def _hue_source(hue: HueSource, offset: float, reverse: bool) -> Callable[[float], float]:
    """Hue in degrees at position t in [0, 1], with the first color offset degrees around the source."""
    if _is_oklch(hue):
        direction = 1 if reverse else -1
        # The same steps as JS, where % keeps the sign, so hues just below 0 wrap to 0, not 360
        return lambda t: math.fmod(math.fmod(offset + direction * 360 * t, 360) + 360, 360)
    scheme = get_scheme(hue)

    def hue_at(t: float) -> float:
        u = (t + offset / 360) % 1
        return lab_to_lch(color_to_oklab(scheme(1 - u if reverse else u)))[2]

    return hue_at


def _fit_count(color_at: Callable[[int], Lab], limit: int, min_gap: float) -> int:
    """Number of leading colors that are all at least min_gap apart, at most limit."""
    colors: list[Lab] = []
    for i in range(limit):
        color = color_at(i)
        if any(lab_distance(c, color) < min_gap for c in colors):
            return i
        colors.append(color)
    return limit
