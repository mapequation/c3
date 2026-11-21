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

blues = c3.sequential(seeds=["#3b82f6"])  # through a color, extended to darker and lighter shades
blues(0.5)  # '#3c83f6', from light at 0 to dark at 1
blues.colors(7)  # 7 steps, '#3b82f6' among them
c3.sequential(seeds=["#2a9d8f", "#e9c46a"]).colors(9)
c3.sequential(seeds=["#d26202"], light_hue=40, dark_hue=-15).colors(9)  # lighter shades turn yellow, darker red
c3.sequential(offset=30).colors(9)  # through palette(offset=30)'s first color
c3.sequential(seeds=["#fff5eb", "#7f2704"], path="straight").colors(9)  # paler oranges than the default

c3.tones["vivid"]  # {'lightness': (0.55, 0.7), 'chroma': (0.15, 0.21), 'warm_hue': 285, 'tilt': 0}
c3.infer_tone(["#e41a1c", "#377eb8", "#4daf4a"])
c3.oklab("steelblue"), c3.oklch("#2b9bea")
c3.distance("#2b9bea", "#2b9beb")  # about 0.02 is just noticeable
```

Tone and end zone fields are snake_case too: `warm_hue` for `warmHue`, `min_gap` for `minGap`.
A `Sequential` scale also works as a `hue` source, and `matplotlib.colors.ListedColormap(scale.colors(256))` turns it into a colormap.

### Hue sources

`hue` is `"Oklch"` (the OKLCH hue circle, the default), the name of a d3 color scheme, or any callable from `t` in [0, 1] to a color. The names are the ones the npm package accepts, with the same colors: `"Viridis"`, `"Cividis"`, `"CubehelixDefault"`, `"Turbo"`, `"Rainbow"` and `"Sinebow"`, and the ColorBrewer schemes, sequential (`"Blues"`, `"Greys"`, `"YlGnBu"`, …) and diverging (`"RdBu"`, `"Spectral"`, …). The callable can return a CSS color string like `"#rrggbb"` or `"rgb(r, g, b)"`, or a sequence of floats in [0, 1] (alpha is ignored), the convention of matplotlib colormaps:

```python
c3.palette(10, hue="Viridis")
c3.sequential(hue="Viridis").colors(9)  # viridis from light to dark
c3.sequential(hue="Viridis", lightness=(0.55, 0.97), light_chroma=0.6, dark_chroma=0.6)  # lighter, softer

import matplotlib

c3.sequential(hue=matplotlib.colormaps["magma"]).colors(9)  # any colormap
```

In `palette()` and `hierarchy()` the scheme gives only the hues. `sequential()` without seeds follows the whole scheme instead: its own colors by default, from light to dark, stretched to `lightness` when you give it, with `light_chroma`, `dark_chroma`, `light_hue` and `dark_hue` scaling its chroma and turning its hue evenly from end to end. The scheme's lightness must go one way, so `"Turbo"`, `"Sinebow"`, `"Rainbow"` and diverging schemes like `"RdBu"` raise a `ValueError` there.

matplotlib is not a dependency. A ColorBrewer scheme by name can differ slightly from the matplotlib colormap of the same name: like d3, c3 runs a B-spline through ColorBrewer's colors, where matplotlib interpolates them linearly.

### Development

```sh
cd python
uv run pytest
uv run --group notebook python examples/execute.py   # re-execute the tutorial in place
```

The tests check every case in `fixtures/c3.json` at the repository root, which the TypeScript library generates with `pnpm --filter @mapequation/c3 fixtures`.
They also check that the committed tutorial notebook has been executed without errors, so re-execute it after changing colors or the notebook.
The `notebook` dependency group has what the tutorial needs, and the notebook downloads the Census state boundaries when it runs.
