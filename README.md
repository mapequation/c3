# C3 - Consistent Categorical Colors

A library to generate distinct categorical colors, written in TypeScript.

[Documentation](https://mapequation.github.io/c3)

### Install

`npm install @mapequation/c3`

### Features
* **Unlimited colors**: Generate as many colors you want
* **Any color scheme**: We generate color stops on the interval `[0, 1]`. Perfect to use with [d3](https://github.com/d3/d3-scale-chromatic).
* **Deterministic**: You always get the same colors for the same requested number of colors.
* **Consistent**: If you increase the number of colors, it doesn't change the list of colors you already have.
* **Fast**: The complexity is `O(n log(n))` for `n` colors. `extend` is `O(n·m)` for `m` candidates with the greedy method, and `O(n·w + n²)` for a window of `w` with the Halton method.

The algorithm is inspired by the [Cantor set](https://en.wikipedia.org/wiki/Cantor_set),
which is a fractal that subdivides an interval recursively into smaller subsets.

### Usage

```js
import { colors, palette, extend, presets } from "@mapequation/c3";

// Colors from a d3 color scheme
colors(20, { scheme: "Sinebow" });

// Vary lightness and chroma to make the colors more distinct
colors(20, { scheme: "Sinebow", vary: true });

// Colors spread over hue, lightness and chroma in OKLCH
palette(20);
palette(20, { hue: 40, lightness: [0.6, 0.8], chroma: [0.05, 0.15] });

// Extend hand-picked colors with as distinct colors as possible
extend(presets.mural, 50);
extend(["#e78c6e", "#838eab"], 20, { method: "halton" });
```

#### `colors(n, options)`

Picks colors from a d3 color scheme at the Cantor stops.
Set `vary` to also vary lightness and chroma in [OKLCH](https://bottosson.github.io/posts/oklab/),
which makes hue-cycling schemes like Sinebow, Rainbow and Turbo noticeably more distinct.
`vary: true` uses ±0.1 lightness and ±40% chroma, a number scales that,
and `{ lightness, chroma }` sets them directly.

#### `palette(n, options)`

Spreads colors over a region of OKLCH color space.
Hue comes from the Cantor stops, lightness and chroma from base-3 and base-5
[van der Corput sequences](https://en.wikipedia.org/wiki/Van_der_Corput_sequence).
Together they form a [Halton sequence](https://en.wikipedia.org/wiki/Halton_sequence),
which fills the region evenly and never moves earlier colors when extended.

| Option | Default | |
|---|---|---|
| `hue` | `125` | Hue of the first color in degrees |
| `reverse` | `true` | Go around the hue circle the other way |
| `lightness` | `[0.67, 0.83]` | OKLCH lightness range |
| `chroma` | `[0.045, 0.135]` | OKLCH chroma range |
| `warmHue`, `tilt` | `285`, `0.15` | Hues away from `warmHue` get a smaller chroma range, by `tilt` from 0 to 1 |
| `like` | | Colors to infer `lightness`, `chroma`, `warmHue` and `tilt` from |
| `lightnessOffset`, `chromaOffset` | `7`, `4` | Start index in the lightness and chroma sequences |

#### `extend(seeds, n, options)`

Returns the seed colors followed by new colors, `n` in total.
Each new color is as far as possible from all colors before it, measured in OKLab.
The region to pick from is inferred from the seeds unless you pass `lightness`, `chroma`, `warmHue` or `tilt`.

* `method: "greedy"` (default) picks the farthest of a fixed set of `m` candidates (4096). Most distinct. `O(n·m)` for `n` new colors, so keep `n` well below `m`.
* `method: "halton"` picks the farthest of the next `w` points along a Halton sequence (64). `O(n·w + n²)`, where the `n²` term has a small constant, so it is several times faster for a few hundred colors. Colors spread more evenly inside the region instead of toward its edges.

`presets.mural` holds five colors from the Englewood mural to start from.

### Development

This is a [pnpm](https://pnpm.io) workspace with the library in `packages/c3` and the documentation app in `apps/docs`.

```sh
pnpm install
pnpm test    # library tests
pnpm build   # library and docs
pnpm dev     # docs app with live library source
```

### Authors
Daniel Edler, Anton Eriksson
