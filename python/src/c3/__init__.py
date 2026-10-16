"""C3 - Consistent Categorical Colors. Deterministic colors for maps.

A Python port of the npm package @mapequation/c3, tested against the same fixtures.
"""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, version

from ._hierarchy import Hierarchy, Module, ModuleColor, hierarchy
from ._oklab import Lab, Lch, distance
from ._oklab import parse_oklab as oklab
from ._oklab import parse_oklch as oklch
from ._palette import EndZone, HueSource, Method, palette
from ._schemes import Scheme, SchemeName
from ._swatches import swatches
from ._tone import PartialTone, Range, Tone, ToneName, ToneOption, infer_tone, tones

try:
    __version__ = version("c3-colors")
except PackageNotFoundError:  # pragma: no cover
    __version__ = "0.0.0"

__all__ = [
    "palette",
    "hierarchy",
    "tones",
    "infer_tone",
    "swatches",
    "oklab",
    "oklch",
    "distance",
    "EndZone",
    "Hierarchy",
    "HueSource",
    "Lab",
    "Lch",
    "Method",
    "Module",
    "ModuleColor",
    "PartialTone",
    "Range",
    "Scheme",
    "SchemeName",
    "Tone",
    "ToneName",
    "ToneOption",
]
