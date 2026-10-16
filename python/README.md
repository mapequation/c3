# C3 for Python - Consistent Categorical Colors

A pure Python port of [`@mapequation/c3`](https://www.npmjs.com/package/@mapequation/c3): deterministic, distinct colors for categories and nested modules, spread over hue, lightness and chroma in OKLCH. No dependencies.

It gives the same colors as the npm package, checked against shared fixtures (within rounding), and the version numbers match, so `c3-colors` 2.0.0 gives the colors of `@mapequation/c3` 2.0.0.

### Install

```sh
pip install c3-colors
```

or `uv add c3-colors`, and import it as `c3`. Requires Python 3.11 or later.

### Usage

The API mirrors the JavaScript one, with options as keyword arguments in snake_case.
The [tutorial notebook](examples/tutorial.ipynb) walks through it with matplotlib, and colors a map with geopandas and network modules with networkx and Infomap.

```python
import c3

c3.palette(5)
# ['#2b9bea', '#cf9f71', '#3b8559', '#b46ba5', '#00b3bb']

c3.palette(10, tone="pastel", offset=90)
c3.palette([3, 1, 1, 2])  # weights: heavier colors get more hue space
c3.palette(8, seeds=["#ff0000"], method="farthest")
c3.palette(40, end="darker")  # later colors in a darker end zone
c3.palette(12, tone={"chroma": (0.1, 0.2), "warm_hue": 60, "tilt": 0.3})
c3.palette(10, tone=c3.swatches["mural"])  # infer the tone from colors

colors = c3.hierarchy([
    {"path": [1, 1], "flow": 0.3},
    {"path": [1, 2], "flow": 0.2},
    {"path": [2, 1], "flow": 0.5},
])
colors([1, 2])  # color of module 1:2
colors.modules  # all modules with path, flow, color and radius, depth first

c3.tones["vivid"]  # {'lightness': (0.55, 0.7), 'chroma': (0.15, 0.21), 'warm_hue': 285, 'tilt': 0}
c3.infer_tone(["#e41a1c", "#377eb8", "#4daf4a"])
c3.oklab("steelblue"), c3.oklch("#2b9bea")
c3.distance("#2b9bea", "#2b9beb")  # about 0.02 is just noticeable
```

Tone and end zone fields are snake_case too: `warm_hue` for `warmHue`, `min_gap` for `minGap`.

### Hue sources

`hue` is `"Oklch"` (the OKLCH hue circle, the default), one of the d3 color schemes `"Turbo"`, `"Sinebow"` or `"Rainbow"`, or any callable from `t` in [0, 1] to a color. The callable can return a CSS color string like `"#rrggbb"` or `"rgb(r, g, b)"`, or a sequence of floats in [0, 1] (alpha is ignored), the convention of matplotlib colormaps:

```python
import matplotlib

c3.palette(10, hue=matplotlib.colormaps["viridis"])
```

matplotlib is not a dependency. The other d3 scheme names the npm package accepts raise a `ValueError`; pass the scheme as a callable instead.

### Development

```sh
cd python
uv run pytest
uv run --group notebook python examples/execute.py   # re-execute the tutorial in place
```

The tests check every case in `fixtures/c3.json` at the repository root, which the TypeScript library generates with `pnpm --filter @mapequation/c3 fixtures`.
They also check that the committed tutorial notebook has been executed without errors, so re-execute it after changing colors or the notebook.
The `notebook` dependency group has what the tutorial needs, and the notebook downloads the Census state boundaries when it runs.
