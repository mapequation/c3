"""The d3-scale-chromatic color schemes c3 supports by name: Turbo, Sinebow and Rainbow.

Ported from d3-scale-chromatic 3.1, returning "rgb(r, g, b)" strings like it does.
"""

from __future__ import annotations

import math
from collections.abc import Callable, Sequence
from typing import Literal, Union

from ._color import cubehelix_rgb, format_rgb, round_byte

#: A color scheme: t in [0, 1] to a CSS color string or (r, g, b[, a]) floats in [0, 1]
Scheme = Callable[[float], Union[str, Sequence[float]]]
SchemeName = Literal["Turbo", "Sinebow", "Rainbow"]


def turbo(t: float) -> str:
    """d3.interpolateTurbo"""
    t = max(0.0, min(1.0, t))
    r = round_byte(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05)))))
    g = round_byte(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56)))))
    b = round_byte(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))
    return f"rgb({r}, {g}, {b})"


_PI_1_3 = math.pi / 3
_PI_2_3 = math.pi * 2 / 3


def sinebow(t: float) -> str:
    """d3.interpolateSinebow"""
    t = (0.5 - t) * math.pi
    x = math.sin(t)
    r = 255 * x * x
    x = math.sin(t + _PI_1_3)
    g = 255 * x * x
    x = math.sin(t + _PI_2_3)
    b = 255 * x * x
    return format_rgb(r, g, b)


def rainbow(t: float) -> str:
    """d3.interpolateRainbow"""
    if t < 0 or t > 1:
        t %= 1
    ts = abs(t - 0.5)
    return format_rgb(*cubehelix_rgb(360 * t - 100, 1.5 - 1.5 * ts, 0.8 - 0.9 * ts))


SCHEMES: dict[str, Scheme] = {"Turbo": turbo, "Sinebow": sinebow, "Rainbow": rainbow}


def get_scheme(scheme: str | Scheme) -> Scheme:
    """The scheme for a name, or the given callable."""
    if callable(scheme):
        return scheme
    if isinstance(scheme, str) and scheme in SCHEMES:
        return SCHEMES[scheme]
    names = ", ".join(f'"{name}"' for name in SCHEMES)
    raise ValueError(
        f"Unknown color scheme: {scheme!r}. The named schemes are {names}; "
        "any callable from t in [0, 1] to a color can be passed instead, "
        'like matplotlib.colormaps["viridis"].'
    )
