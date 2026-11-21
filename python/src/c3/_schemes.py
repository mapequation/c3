"""The d3-scale-chromatic color schemes c3 supports by name, the same as the npm package.

Ported from d3-scale-chromatic 3.1, returning the same colors as it does: "rgb(r, g, b)"
strings, and "#rrggbb" for Viridis.

All schemes but Cividis, CubehelixDefault, Turbo, Viridis, Rainbow and Sinebow are Cynthia A.
Brewer's ColorBrewer schemes, Copyright 2002 Cynthia Brewer, Mark Harrower, and The Pennsylvania
State University, licensed under the Apache License, Version 2.0. Like d3, c3 runs a B-spline
through their colors.
"""

from __future__ import annotations

import math
from collections.abc import Callable, Sequence
from typing import Literal, Union

from ._color import cubehelix_rgb, format_rgb, round_byte

#: A color scheme: t in [0, 1] to a CSS color string or (r, g, b[, a]) floats in [0, 1]
Scheme = Callable[[float], Union[str, Sequence[float]]]
SchemeName = Literal[
    # diverging
    "BrBG",
    "PRGn",
    "PiYG",
    "PuOr",
    "RdBu",
    "RdGy",
    "RdYlBu",
    "RdYlGn",
    "Spectral",
    # sequential-single
    "Greens",
    "Greys",
    "Purples",
    "Reds",
    "Oranges",
    # sequential-multi
    "BuGn",
    "BuPu",
    "GnBu",
    "OrRd",
    "PuBuGn",
    "PuBu",
    "PuRd",
    "RdPu",
    "YlGnBu",
    "YlGn",
    "YlOrBr",
    "YlOrRd",
    "Blues",
    "Cividis",
    "CubehelixDefault",
    "Turbo",
    "Viridis",
    # sequential-cyclic
    "Rainbow",
    "Sinebow",
]

# The largest ColorBrewer scheme of each name, as d3's colors() specifiers: 6 hex digits per color
_BASIS_SCHEMES: dict[str, str] = {
    "BrBG": "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30",
    "PRGn": "40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b",
    "PiYG": "8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419",
    "PuOr": "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08",
    "RdBu": "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061",
    "RdGy": "67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a",
    "RdYlBu": "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695",
    "RdYlGn": "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837",
    "Spectral": "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2",
    "Greens": "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b",
    "Greys": "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000",
    "Purples": "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d",
    "Reds": "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d",
    "Oranges": "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704",
    "BuGn": "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b",
    "BuPu": "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b",
    "GnBu": "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081",
    "OrRd": "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000",
    "PuBuGn": "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636",
    "PuBu": "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858",
    "PuRd": "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f",
    "RdPu": "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a",
    "YlGnBu": "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58",
    "YlGn": "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529",
    "YlOrBr": "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506",
    "YlOrRd": "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026",
    "Blues": "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b",
}
# d3's Viridis: 256 colors that it reads without interpolating
_VIRIDIS = (
    "44015444025645045745055946075a46085c460a5d460b5e470d60470e61471063471164471365481467481668481769"
    "48186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a"
    "472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f85"
    "4240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b"
    "3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d"
    "33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e"
    "2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e"
    "26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d"
    "21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f88"
    "1fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad81"
    "28ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc74"
    "3fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc863"
    "5ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d"
    "84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32"
    "addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21a"
    "d8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"
)


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


def cividis(t: float) -> str:
    """d3.interpolateCividis"""
    t = max(0.0, min(1.0, t))
    r = round_byte(-4.54 - t * (35.34 - t * (2381.73 - t * (6402.7 - t * (7024.72 - t * 2710.57)))))
    g = round_byte(32.49 + t * (170.73 + t * (52.82 - t * (131.46 - t * (176.58 - t * 67.37)))))
    b = round_byte(81.24 + t * (442.36 - t * (2482.43 - t * (6167.24 - t * (6614.94 - t * 2475.67)))))
    return f"rgb({r}, {g}, {b})"


def cubehelix_default(t: float) -> str:
    """d3.interpolateCubehelixDefault: interpolateCubehelixLong(cubehelix(300, 0.5, 0), cubehelix(-240, 0.5, 1))"""
    return format_rgb(*cubehelix_rgb(300 + t * -540, 0.5, t))


def _colors(specifier: str) -> list[str]:
    """d3's colors(): "#rrggbb" for every 6 hex digits"""
    return [f"#{specifier[i : i + 6]}" for i in range(0, len(specifier), 6)]


def ramp(colors: Sequence[str]) -> Callable[[float], str]:
    """d3's ramp() for 256-color schemes: the color at index floor(t * n), clamped"""
    n = len(colors)
    return lambda t: colors[max(0, min(n - 1, math.floor(t * n)))]


def _basis(t1: float, v0: float, v1: float, v2: float, v3: float) -> float:
    t2 = t1 * t1
    t3 = t2 * t1
    return (
        (1 - 3 * t1 + 3 * t2 - t3) * v0
        + (4 - 6 * t2 + 3 * t3) * v1
        + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
        + t3 * v3
    ) / 6


def _spline(values: Sequence[float]) -> Callable[[float], float]:
    """d3.interpolateBasis: a uniform B-spline through the values"""
    n = len(values) - 1

    def at(t: float) -> float:
        if t <= 0:
            t, i = 0.0, 0
        elif t >= 1:
            t, i = 1.0, n - 1
        else:
            i = math.floor(t * n)
        v1 = values[i]
        v2 = values[i + 1]
        v0 = values[i - 1] if i > 0 else 2 * v1 - v2
        v3 = values[i + 2] if i < n - 1 else 2 * v2 - v1
        return _basis((t - i / n) * n, v0, v1, v2, v3)

    return at


def rgb_basis(specifier: str) -> Callable[[float], str]:
    """d3.interpolateRgbBasis over the colors of a colors() specifier"""
    colors = _colors(specifier)
    r, g, b = (_spline([int(color[k : k + 2], 16) for color in colors]) for k in (1, 3, 5))
    return lambda t: format_rgb(r(t), g(t), b(t))


SCHEMES: dict[str, Scheme] = {
    **{name: rgb_basis(specifier) for name, specifier in _BASIS_SCHEMES.items()},
    "Cividis": cividis,
    "CubehelixDefault": cubehelix_default,
    "Turbo": turbo,
    "Viridis": ramp(_colors(_VIRIDIS)),
    "Rainbow": rainbow,
    "Sinebow": sinebow,
}


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
        'like matplotlib.colormaps["magma"].'
    )
