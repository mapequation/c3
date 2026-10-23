"""Python-specific behavior: options, callable hue sources and errors. Parity with the npm package is in test_fixtures.py."""

import math
import re

import pytest

import c3
from c3._color import parse_rgb
from c3._palette import _hue_source
from c3._schemes import turbo

HEX = re.compile(r"^#[0-9a-f]{6}$")


def test_palette_is_deterministic_and_consistent_when_n_grows():
    colors = c3.palette(50)
    assert len(colors) == 50 and all(HEX.match(c) for c in colors)
    assert c3.palette(20) == colors[:20]


def test_options_accept_tuples_and_lists():
    assert c3.palette(8, tone={"lightness": (0.5, 0.8)}) == c3.palette(8, tone={"lightness": [0.5, 0.8]})
    assert c3.palette(8, end=(0.3, 0.45)) == c3.palette(8, end=[0.3, 0.45])
    assert c3.palette(8, tone=c3.swatches["mural"]) == c3.palette(8, tone=list(c3.swatches["mural"]))


def test_end_true_is_the_default_end_zone():
    assert c3.palette(40, end=True) == c3.palette(40, end="darker")


def test_hue_accepts_a_callable_returning_css_colors():
    assert c3.palette(12, hue=turbo) == c3.palette(12, hue="Turbo")


def test_hue_accepts_a_callable_returning_floats_like_matplotlib():
    def colormap(t):
        r, g, b = parse_rgb(turbo(t))
        return (r / 255, g / 255, b / 255, 1.0)

    assert c3.palette(12, hue=colormap) == c3.palette(12, hue="Turbo")
    assert c3.hierarchy([{"path": [1, 1]}, {"path": [2]}], hue=colormap).modules == (
        c3.hierarchy([{"path": [1, 1]}, {"path": [2]}], hue="Turbo").modules
    )


def test_matplotlib_colormap():
    matplotlib = pytest.importorskip("matplotlib")
    colors = c3.palette(10, hue=matplotlib.colormaps["viridis"])
    assert len(colors) == 10 and all(HEX.match(c) for c in colors)


def test_unknown_scheme_names_the_supported_ones():
    with pytest.raises(ValueError, match=r'"Turbo", "Sinebow", "Rainbow".*callable'):
        c3.palette(5, hue="Viridis")


@pytest.mark.parametrize(
    "call",
    [
        lambda: c3.palette(5, tone="loud"),
        lambda: c3.palette(5, tone={"warmHue": 60}),
        lambda: c3.palette(5, seeds=["red"], method="sequence"),
        lambda: c3.palette(5, method="random"),
        lambda: c3.palette(5, end={"minGap": 0.1}),
        lambda: c3.palette(-1),
        lambda: c3.oklab("not a color"),
        lambda: c3.oklab("transparent"),
        lambda: c3.distance("red", "rgba(0, 0, 0, 0)"),
        lambda: c3.palette(5, method="farthest", candidates=0),
        lambda: c3.palette(5, method="lookahead", lookahead=0),
        lambda: c3.palette([1, math.inf]),
        lambda: c3.palette([1, math.nan]),
        lambda: c3.hierarchy([{"path": [1], "flow": math.inf}]),
        lambda: c3.hierarchy([{"path": [1], "flow": -math.inf}]),
        lambda: c3.hierarchy([{"path": [1], "flow": math.nan}]),
        lambda: c3.hierarchy([{"path": [1, math.nan]}]),
    ],
)
def test_invalid_input_raises_value_error(call):
    with pytest.raises(ValueError):
        call()


def test_hierarchy_lookup():
    colors = c3.hierarchy([{"path": [1, 1], "flow": 2}, {"path": [1, 2], "flow": 1}, {"path": [2]}])
    assert [m["path"] for m in colors.modules] == [[1], [1, 1], [1, 2], [2]]
    assert colors.modules[0]["flow"] == 3
    assert colors([1, 2, 7]) == colors([1, 2]) == colors.modules[2]["color"]
    assert colors([3]) is None and colors([]) is None
    assert c3.hierarchy([]).modules == []


def test_hierarchy_names_the_module_with_a_flow_that_is_not_finite():
    with pytest.raises(ValueError, match=r"Flow must be finite, got inf for module \[1, 1\]"):
        c3.hierarchy([{"path": [1, 1], "flow": math.inf}, {"path": [2], "flow": 1}])


def test_oklch_hues_just_below_zero_wrap_to_zero_like_js():
    assert _hue_source("Oklch", math.nextafter(90, 0) - 90, False)(0) == 0


def test_infer_tone_takes_a_sequence():
    assert c3.infer_tone([]) == c3.tones["strong"]
    with pytest.raises(TypeError):
        c3.infer_tone("#ff0000")


@pytest.mark.parametrize("weights", [[0], [0, 0], [0, 0, 1], [1, 0, 0], [5, 0, 0, 0, 0, 0, 0, 1], [0] * 9, [3, 0, 2, 0, 0, 1]])
def test_zero_weights_get_valid_distinct_colors(weights):
    colors = c3.palette(weights)
    assert len(colors) == len(weights) and all(HEX.match(c) for c in colors)
    assert len(set(colors)) == len(colors)


def test_zero_weights_count_as_the_smallest_positive_weight():
    assert c3.palette([3, 0, 2, 0, 0.5]) == c3.palette([3, 0.5, 2, 0.5, 0.5])
    assert c3.palette([0] * 5) == c3.palette(5)


def test_zero_flows_count_as_the_smallest_positive_flow_on_their_level():
    with_zero = [
        {"path": [1, 1], "flow": 0.5},
        {"path": [1, 2], "flow": 0.2},
        {"path": [2], "flow": 0},
        {"path": [2, 1], "flow": 0},
        {"path": [2, 2], "flow": 0},
        {"path": [3], "flow": 0.1},
    ]
    # The smallest positive flows are 0.1 on the top level and 0.2 below it
    smallest = [{"path": m["path"], "flow": m["flow"] or (0.1, 0.2)[len(m["path"]) - 1]} for m in with_zero]
    colors = c3.hierarchy(with_zero)
    assert [m["color"] for m in colors.modules] == [m["color"] for m in c3.hierarchy(smallest).modules]
    assert len({colors([2]), colors([2, 1]), colors([2, 2])}) == 3
