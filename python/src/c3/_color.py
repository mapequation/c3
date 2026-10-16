"""CSS color parsing: hex, rgb(), rgba(), hsl(), hsla() and named colors.

Follows d3-color's ``rgb()``, which the TypeScript library parses colors with, and its
``formatRgb()``, which the d3 color schemes return.
"""

from __future__ import annotations

import math
import re

RGB = tuple[float, float, float]

_NUM = r"([+-]?(?:[0-9]*\.)?[0-9]+(?:[eE][+-]?[0-9]+)?)"
_RE_I = r"\s*([+-]?[0-9]+)\s*"
_RE_N = rf"\s*{_NUM}\s*"
_RE_P = rf"\s*{_NUM}%\s*"

_HEX = re.compile(r"#([0-9a-f]{3,8})")
_RGB_INTEGER = re.compile(rf"rgb\({_RE_I},{_RE_I},{_RE_I}\)")
_RGB_PERCENT = re.compile(rf"rgb\({_RE_P},{_RE_P},{_RE_P}\)")
_RGBA_INTEGER = re.compile(rf"rgba\({_RE_I},{_RE_I},{_RE_I},{_RE_N}\)")
_RGBA_PERCENT = re.compile(rf"rgba\({_RE_P},{_RE_P},{_RE_P},{_RE_N}\)")
_HSL_PERCENT = re.compile(rf"hsl\({_RE_N},{_RE_P},{_RE_P}\)")
_HSLA_PERCENT = re.compile(rf"hsla\({_RE_N},{_RE_P},{_RE_P},{_RE_N}\)")


def parse_rgb(color: object) -> RGB | None:
    """A CSS color as (r, g, b) in 0 to 255, unclamped, or None if it can't be parsed or is transparent."""
    fmt = str(color).strip().lower()
    if m := _HEX.fullmatch(fmt):
        digits = m.group(1)
        n = int(digits, 16)
        if len(digits) == 6:
            return _rgbn(n)
        if len(digits) == 3:
            return (
                float((n >> 8 & 0xF) | (n >> 4 & 0xF0)),
                float((n >> 4 & 0xF) | (n & 0xF0)),
                float(((n & 0xF) << 4) | (n & 0xF)),
            )
        if len(digits) == 8:
            return _rgba(n >> 24 & 0xFF, n >> 16 & 0xFF, n >> 8 & 0xFF, (n & 0xFF) / 0xFF)
        if len(digits) == 4:
            return _rgba(
                (n >> 12 & 0xF) | (n >> 8 & 0xF0),
                (n >> 8 & 0xF) | (n >> 4 & 0xF0),
                (n >> 4 & 0xF) | (n & 0xF0),
                (((n & 0xF) << 4) | (n & 0xF)) / 0xFF,
            )
        return None
    if m := _RGB_INTEGER.fullmatch(fmt):
        return (float(m[1]), float(m[2]), float(m[3]))
    if m := _RGB_PERCENT.fullmatch(fmt):
        return (float(m[1]) * 255 / 100, float(m[2]) * 255 / 100, float(m[3]) * 255 / 100)
    if m := _RGBA_INTEGER.fullmatch(fmt):
        return _rgba(float(m[1]), float(m[2]), float(m[3]), float(m[4]))
    if m := _RGBA_PERCENT.fullmatch(fmt):
        return _rgba(float(m[1]) * 255 / 100, float(m[2]) * 255 / 100, float(m[3]) * 255 / 100, float(m[4]))
    if m := _HSL_PERCENT.fullmatch(fmt):
        return _hsla(float(m[1]), float(m[2]) / 100, float(m[3]) / 100, 1.0)
    if m := _HSLA_PERCENT.fullmatch(fmt):
        return _hsla(float(m[1]), float(m[2]) / 100, float(m[3]) / 100, float(m[4]))
    if fmt in NAMED:
        return _rgbn(NAMED[fmt])
    return None  # also "transparent"


def _rgbn(n: int) -> RGB:
    return (float(n >> 16 & 0xFF), float(n >> 8 & 0xFF), float(n & 0xFF))


def _rgba(r: float, g: float, b: float, a: float) -> RGB | None:
    return None if a <= 0 else (float(r), float(g), float(b))


def _hsla(h: float, s: float, l: float, a: float) -> RGB | None:
    if a <= 0:
        return None
    if s <= 0 or l <= 0 or l >= 1:  # grey, black or white
        return (l * 255, l * 255, l * 255)
    h %= 360
    m2 = l + (l if l < 0.5 else 1 - l) * s
    m1 = 2 * l - m2
    return (
        _hsl2rgb(h - 240 if h >= 240 else h + 120, m1, m2),
        _hsl2rgb(h, m1, m2),
        _hsl2rgb(h + 240 if h < 120 else h - 120, m1, m2),
    )


def _hsl2rgb(h: float, m1: float, m2: float) -> float:
    if h < 60:
        v = m1 + (m2 - m1) * h / 60
    elif h < 180:
        v = m2
    elif h < 240:
        v = m1 + (m2 - m1) * (240 - h) / 60
    else:
        v = m1
    return v * 255


def round_byte(value: float) -> int:
    """A color channel rounded to an integer in 0 to 255, with halves rounded up."""
    return max(0, min(255, math.floor(value + 0.5)))


def format_rgb(r: float, g: float, b: float) -> str:
    """An opaque color as "rgb(r, g, b)" with rounded, clamped channels, like d3's rgb.formatRgb()."""
    return f"rgb({round_byte(r)}, {round_byte(g)}, {round_byte(b)})"


# d3-color cubehelix
_A = -0.14861
_B = +1.78277
_C = -0.29227
_D = -0.90649
_E = +1.97294


def cubehelix_rgb(h: float, s: float, l: float) -> RGB:
    """d3.cubehelix(h, s, l).rgb()"""
    hr = math.radians(h + 120)
    a = s * l * (1 - l)
    cosh = math.cos(hr)
    sinh = math.sin(hr)
    return (
        255 * (l + a * (_A * cosh + _B * sinh)),
        255 * (l + a * (_C * cosh + _D * sinh)),
        255 * (l + a * (_E * cosh)),
    )


NAMED: dict[str, int] = {
    "aliceblue": 0xf0f8ff,
    "antiquewhite": 0xfaebd7,
    "aqua": 0x00ffff,
    "aquamarine": 0x7fffd4,
    "azure": 0xf0ffff,
    "beige": 0xf5f5dc,
    "bisque": 0xffe4c4,
    "black": 0x000000,
    "blanchedalmond": 0xffebcd,
    "blue": 0x0000ff,
    "blueviolet": 0x8a2be2,
    "brown": 0xa52a2a,
    "burlywood": 0xdeb887,
    "cadetblue": 0x5f9ea0,
    "chartreuse": 0x7fff00,
    "chocolate": 0xd2691e,
    "coral": 0xff7f50,
    "cornflowerblue": 0x6495ed,
    "cornsilk": 0xfff8dc,
    "crimson": 0xdc143c,
    "cyan": 0x00ffff,
    "darkblue": 0x00008b,
    "darkcyan": 0x008b8b,
    "darkgoldenrod": 0xb8860b,
    "darkgray": 0xa9a9a9,
    "darkgreen": 0x006400,
    "darkgrey": 0xa9a9a9,
    "darkkhaki": 0xbdb76b,
    "darkmagenta": 0x8b008b,
    "darkolivegreen": 0x556b2f,
    "darkorange": 0xff8c00,
    "darkorchid": 0x9932cc,
    "darkred": 0x8b0000,
    "darksalmon": 0xe9967a,
    "darkseagreen": 0x8fbc8f,
    "darkslateblue": 0x483d8b,
    "darkslategray": 0x2f4f4f,
    "darkslategrey": 0x2f4f4f,
    "darkturquoise": 0x00ced1,
    "darkviolet": 0x9400d3,
    "deeppink": 0xff1493,
    "deepskyblue": 0x00bfff,
    "dimgray": 0x696969,
    "dimgrey": 0x696969,
    "dodgerblue": 0x1e90ff,
    "firebrick": 0xb22222,
    "floralwhite": 0xfffaf0,
    "forestgreen": 0x228b22,
    "fuchsia": 0xff00ff,
    "gainsboro": 0xdcdcdc,
    "ghostwhite": 0xf8f8ff,
    "gold": 0xffd700,
    "goldenrod": 0xdaa520,
    "gray": 0x808080,
    "green": 0x008000,
    "greenyellow": 0xadff2f,
    "grey": 0x808080,
    "honeydew": 0xf0fff0,
    "hotpink": 0xff69b4,
    "indianred": 0xcd5c5c,
    "indigo": 0x4b0082,
    "ivory": 0xfffff0,
    "khaki": 0xf0e68c,
    "lavender": 0xe6e6fa,
    "lavenderblush": 0xfff0f5,
    "lawngreen": 0x7cfc00,
    "lemonchiffon": 0xfffacd,
    "lightblue": 0xadd8e6,
    "lightcoral": 0xf08080,
    "lightcyan": 0xe0ffff,
    "lightgoldenrodyellow": 0xfafad2,
    "lightgray": 0xd3d3d3,
    "lightgreen": 0x90ee90,
    "lightgrey": 0xd3d3d3,
    "lightpink": 0xffb6c1,
    "lightsalmon": 0xffa07a,
    "lightseagreen": 0x20b2aa,
    "lightskyblue": 0x87cefa,
    "lightslategray": 0x778899,
    "lightslategrey": 0x778899,
    "lightsteelblue": 0xb0c4de,
    "lightyellow": 0xffffe0,
    "lime": 0x00ff00,
    "limegreen": 0x32cd32,
    "linen": 0xfaf0e6,
    "magenta": 0xff00ff,
    "maroon": 0x800000,
    "mediumaquamarine": 0x66cdaa,
    "mediumblue": 0x0000cd,
    "mediumorchid": 0xba55d3,
    "mediumpurple": 0x9370db,
    "mediumseagreen": 0x3cb371,
    "mediumslateblue": 0x7b68ee,
    "mediumspringgreen": 0x00fa9a,
    "mediumturquoise": 0x48d1cc,
    "mediumvioletred": 0xc71585,
    "midnightblue": 0x191970,
    "mintcream": 0xf5fffa,
    "mistyrose": 0xffe4e1,
    "moccasin": 0xffe4b5,
    "navajowhite": 0xffdead,
    "navy": 0x000080,
    "oldlace": 0xfdf5e6,
    "olive": 0x808000,
    "olivedrab": 0x6b8e23,
    "orange": 0xffa500,
    "orangered": 0xff4500,
    "orchid": 0xda70d6,
    "palegoldenrod": 0xeee8aa,
    "palegreen": 0x98fb98,
    "paleturquoise": 0xafeeee,
    "palevioletred": 0xdb7093,
    "papayawhip": 0xffefd5,
    "peachpuff": 0xffdab9,
    "peru": 0xcd853f,
    "pink": 0xffc0cb,
    "plum": 0xdda0dd,
    "powderblue": 0xb0e0e6,
    "purple": 0x800080,
    "rebeccapurple": 0x663399,
    "red": 0xff0000,
    "rosybrown": 0xbc8f8f,
    "royalblue": 0x4169e1,
    "saddlebrown": 0x8b4513,
    "salmon": 0xfa8072,
    "sandybrown": 0xf4a460,
    "seagreen": 0x2e8b57,
    "seashell": 0xfff5ee,
    "sienna": 0xa0522d,
    "silver": 0xc0c0c0,
    "skyblue": 0x87ceeb,
    "slateblue": 0x6a5acd,
    "slategray": 0x708090,
    "slategrey": 0x708090,
    "snow": 0xfffafa,
    "springgreen": 0x00ff7f,
    "steelblue": 0x4682b4,
    "tan": 0xd2b48c,
    "teal": 0x008080,
    "thistle": 0xd8bfd8,
    "tomato": 0xff6347,
    "turquoise": 0x40e0d0,
    "violet": 0xee82ee,
    "wheat": 0xf5deb3,
    "white": 0xffffff,
    "whitesmoke": 0xf5f5f5,
    "yellow": 0xffff00,
    "yellowgreen": 0x9acd32,
}
