"""Colors for nested modules."""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from typing import Any, NotRequired, Required, TypedDict

from ._oklab import Lab, in_gamut, lab_distance, lab_to_hex, lab_to_lch, parse_oklab
from ._palette import (
    DEFAULT_CANDIDATES,
    DEFAULT_CHROMA_OFFSET,
    DEFAULT_LIGHTNESS_OFFSET,
    DEFAULT_LOOKAHEAD,
    EndOption,
    HueSource,
    Method,
    _Options,
    _palette,
    palette_tones,
)
from ._stops import positive_weights, van_der_corput
from ._tone import ToneOption


class Module(TypedDict, total=False):
    """A module by its path from the top, like [1, 4, 3] for the third child of the fourth child of module 1."""

    path: Required[Sequence[int]]
    #: Flow or another size, summed over repeated paths. Modules without flow get the sum of their children's, or 1.
    flow: NotRequired[float]


class ModuleColor(TypedDict):
    """A module with its color and the ball its children were placed in."""

    path: list[int]
    flow: float
    color: str
    #: Radius in OKLab of the ball around the color that holds the children, 0 without children
    radius: float


DEFAULT_PADDING = 0.2


class _TreeNode:
    __slots__ = ("key", "path", "index", "flow", "children", "lab", "radius")

    def __init__(self, key: tuple, path: list, index: float):
        self.key = key
        self.path = path
        self.index = index
        self.flow: float = 0
        self.children: list[_TreeNode] = []
        self.lab: Lab | None = None
        self.radius: float | None = None


# Halton points in the unit ball, the candidates for child colors
_BALL_POINTS = 512


def _make_ball() -> list[Lab]:
    ball: list[Lab] = []
    i = 1
    while len(ball) < _BALL_POINTS:
        p = (2 * van_der_corput(i, 2) - 1, 2 * van_der_corput(i, 3) - 1, 2 * van_der_corput(i, 5) - 1)
        if math.hypot(*p) <= 1:
            ball.append(p)
        i += 1
    return ball


_BALL = _make_ball()


class Hierarchy:
    """
    Module colors from hierarchy(). Call it with a path to get the color of the
    deepest module on the path, or None if there is none.
    """

    __slots__ = ("modules", "_colors")

    def __init__(self, modules: list[ModuleColor], colors: dict[tuple, str]):
        #: All modules in depth-first order
        self.modules = modules
        self._colors = colors

    def __call__(self, path: Sequence[float]) -> str | None:
        path = tuple(path)
        for n in range(len(path), 0, -1):
            color = self._colors.get(path[:n])
            if color:
                return color
        return None

    def __repr__(self) -> str:
        return f"Hierarchy({len(self.modules)} modules)"


def hierarchy(
    modules: Sequence[Module],
    *,
    padding: float = DEFAULT_PADDING,
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
) -> Hierarchy:
    """
    Colors for nested modules. Top modules get palette() colors. Each module
    gets a ball in OKLab around its color, splitting the distance to the other
    modules on the same level by the square root of their flows, and its
    children get colors as distinct as possible inside that ball.

    :param modules: Modules by path, like one per node with its module path and flow; missing parents are added
    :param padding: Fraction of the space between two modules left empty, so children
        stay closer to their parent than to their cousins
    :param tone, hue, offset, reverse, seeds, method, candidates, lookahead, lightness_offset,
        chroma_offset, end: palette() options for the top modules
    :returns: a callable from path to color, which for a longer path gives the color of
        its deepest module, with all modules in depth-first order as ``modules``
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
    padding = DEFAULT_PADDING if padding is None else padding
    nodes = _build_tree(modules)
    top = nodes[()].children

    # Keep children inside the lightness and chroma ranges the palette uses, so they don't
    # grey out. Where the gamut holds a parent below the chroma range, its children may
    # go as low as the parent.
    top_tone, bottom = palette_tones(options)
    lightness_bounds = (
        min(top_tone["lightness"][0], bottom["lightness"][0]),
        max(top_tone["lightness"][1], bottom["lightness"][1]),
    )
    chroma_bounds = (
        min(top_tone["chroma"][0], bottom["chroma"][0]),
        max(top_tone["chroma"][1], bottom["chroma"][1]),
    )

    def allowed_around(parent: Lab):
        min_chroma = min(chroma_bounds[0], lab_to_lch(parent)[1])

        def allowed(lab: Lab) -> bool:
            L, C, _ = lab_to_lch(lab)
            return (
                lightness_bounds[0] <= L <= lightness_bounds[1]
                and min_chroma <= C <= chroma_bounds[1]
                and in_gamut(lab)
            )

        return allowed

    top_colors = _palette([node.flow for node in top], options)
    for node, color in zip(top, top_colors, strict=True):
        node.lab = parse_oklab(color)

    level = top
    while level:
        # Zero flows count as the smallest flow on the level, like zero weights in palette()
        sizes = [math.sqrt(flow) for flow in positive_weights(node.flow for node in level)]
        for i, node in enumerate(level):
            if node.children:
                node.radius = (1 - padding) * _share(i, level, sizes)
                _place_children(node, node.radius, allowed_around(node.lab))  # type: ignore[arg-type]
        level = [child for node in level for child in node.children]

    colors: dict[tuple, str] = {}
    listed: list[ModuleColor] = []

    def visit(node: _TreeNode) -> None:
        color = lab_to_hex(node.lab)  # type: ignore[arg-type]
        colors[node.key] = color
        listed.append(
            {"path": list(node.path), "flow": node.flow, "color": color, "radius": 0 if node.radius is None else node.radius}
        )
        for child in node.children:
            visit(child)

    for node in top:
        visit(node)

    return Hierarchy(listed, colors)


def _build_tree(modules: Sequence[Module]) -> dict[tuple, _TreeNode]:
    nodes: dict[tuple, _TreeNode] = {(): _TreeNode((), [], 0)}
    given: dict[tuple, float] = {}

    for module in modules:
        path, flow = _module_fields(module)
        for n in range(1, len(path) + 1):
            key = tuple(path[:n])
            if key in nodes:
                continue
            node = _TreeNode(key, list(path[:n]), path[n - 1])
            nodes[key] = node
            nodes[key[:-1]].children.append(node)
        if flow is not None:
            key = tuple(path)
            given[key] = given.get(key, 0) + flow

    # Children in path order, which for Infomap is by flow
    def total(node: _TreeNode) -> float:
        node.children.sort(key=lambda child: child.index)
        child_flow: float = 0
        for child in node.children:
            child_flow = child_flow + total(child)
        flow = given.get(node.key)
        node.flow = flow if flow is not None else (child_flow if len(node.children) > 0 else 1)
        return node.flow

    total(nodes[()])
    return nodes


def _module_fields(module: Module | Any) -> tuple[Sequence[float], float | None]:
    if isinstance(module, Mapping):
        return list(module["path"]), module.get("flow")
    raise TypeError(f"A module is a dict with a path and an optional flow, got {module!r}")


def _share(i: int, level: list[_TreeNode], sizes: list[float]) -> float:
    """
    Largest distance from the color of the i:th module on the level that stays on its side
    of every other module there, splitting each distance by the sizes, the square roots of the flows.
    """
    node, w = level[i], sizes[i]
    return min(
        (
            lab_distance(node.lab, other.lab) * (w / (w + v))  # type: ignore[arg-type]
            for j, (other, v) in enumerate(zip(level, sizes))
            if j != i
        ),
        default=0.05,  # alone on its level
    )


def _place_children(parent: _TreeNode, radius: float, allowed) -> None:
    """Farthest point sampling of Halton candidates in the ball around the parent."""
    L, a, b = parent.lab  # type: ignore[misc]
    candidates = [c for c in ((L + radius * p[0], a + radius * p[1], b + radius * p[2]) for p in _BALL) if allowed(c)]
    if len(candidates) == 0:
        for child in parent.children:
            child.lab = parent.lab
        return
    min_dist = [math.inf] * len(candidates)
    for child in parent.children:
        best = 0
        for i in range(1, len(candidates)):
            if min_dist[i] > min_dist[best]:
                best = i
        child.lab = candidates[best]
        for i, c in enumerate(candidates):
            d = lab_distance(c, child.lab)
            if d < min_dist[i]:
                min_dist[i] = d
