# C3 - Consistent Categorical Colors

A library to generate distinct categorical colors, written in TypeScript.

[Documentation](https://mapequation.github.io/c3)

### Install

`npm install @mapequation/c3`

### Features
* **Unlimited colors**: Generate as many colors you want
* **Any color scheme**: Hues come from color stops on the interval `[0, 1]`, on the OKLCH hue circle or any [d3](https://github.com/d3/d3-scale-chromatic) color scheme.
* **Deterministic**: You always get the same colors for the same requested number of colors.
* **Consistent**: If you increase the number of colors, it doesn't change the list of colors you already have.
* **Fast**: The complexity is `O(n log(n))` for `n` colors. `extend` is `O(n·m)` for `m` candidates with the greedy method, and `O(n·w + n²)` for a window of `w` with the Halton method.

The algorithm is inspired by the [Cantor set](https://en.wikipedia.org/wiki/Cantor_set),
which is a fractal that subdivides an interval recursively into smaller subsets.

### Usage

```js
import { palette, extend, presets } from "@mapequation/c3";

// Colors spread over hue, lightness and chroma in OKLCH
palette(20);
palette(20, { hue: 40, lightness: [0.6, 0.8], chroma: [0.05, 0.15] });

// Hues from a d3 color scheme
palette(20, { hue: "Sinebow" });

// Extend hand-picked colors with as distinct colors as possible
extend(presets.mural, 50);
extend(["#e78c6e", "#838eab"], 20, { method: "halton" });
```

#### `palette(n, options)`

Spreads colors over a region of [OKLCH](https://bottosson.github.io/posts/oklab/) color space.
Hue comes from the Cantor stops, lightness and chroma from base-3 and base-5
[van der Corput sequences](https://en.wikipedia.org/wiki/Van_der_Corput_sequence).
Together they form a [Halton sequence](https://en.wikipedia.org/wiki/Halton_sequence),
which fills the region evenly and never moves earlier colors when extended.

| Option | Default | |
|---|---|---|
| `hue` | `125` | Hue of the first color in degrees, going toward lower hues, or a d3 scheme name or interpolator to take hues from |
| `offset` | `0` | Shift the stops along the hue circle or scheme, from 0 to 1 |
| `reverse` | `false` | Go toward higher hues, or read the scheme from 1 to 0 |
| `lightness` | `[0.67, 0.83]` | OKLCH lightness range |
| `chroma` | `[0.045, 0.135]` | OKLCH chroma range |
| `warmHue`, `tilt` | `285`, `0.15` | Hues away from `warmHue` get a smaller chroma range, by `tilt` from 0 to 1 |
| `like` | | Colors to infer `lightness`, `chroma`, `warmHue` and `tilt` from. For a scheme, `chroma`, `warmHue` and `tilt` come from the center 90% of the scheme's own colors unless given, and `lightness` keeps its default so the first colors have similar lightness |
| `lightnessOffset`, `chromaOffset` | `7`, `4` | Start index in the lightness and chroma sequences |
| `end` | lighter | Region for later colors, see zones below. Darker or greyer if the top region is already light. `false` turns zones off |
| `midpoint` | `"auto"` | Number of colors in the top zone, or `"auto"` for as many as fit `minGap` apart |
| `minGap` | `0.04` | Smallest distance between top zone colors for `"auto"` |
| `steepness` | `4` | How quickly colors after the midpoint move to the end region: 80% of the way at 1.5 times the midpoint and 94% at twice it. `Infinity` switches at once |

#### Zones

The first colors matter most, so they should stay distinct however many colors you ask for.
The top zone holds the first colors, by default as many as fit `minGap` apart in the region.
Later colors come from the `end` region so they never look like the first ones. By default it is lighter than the top region, or darker or greyer if the top region is already light.
They can be less distinct from each other.
Colors after the top zone fade into the end region over the next colors; `steepness: Infinity` switches at once instead, which keeps them furthest from the top zone.
The zone boundary depends only on the region, not on `n`, so asking for more colors never changes the earlier ones.

#### `extend(seeds, n, options)`

Returns the seed colors followed by new colors, `n` in total.
Each new color is as far as possible from all colors before it, measured in OKLab.
The region to pick from is inferred from the seeds unless you pass `lightness`, `chroma`, `warmHue` or `tilt`.
It takes the same zone options as `palette()`, except `steepness`.

* `method: "greedy"` (default) picks the farthest of a fixed set of `m` candidates (4096). Most distinct. `O(n·m)` for `n` new colors, so keep `n` well below `m`.
* `method: "halton"` picks the farthest of the next `w` points along a Halton sequence (64). `O(n·w + n²)`, where the `n²` term has a small constant, so it is several times faster for a few hundred colors. Colors spread more evenly inside the region instead of toward its edges.

`presets.mural` holds five colors from the Englewood mural to start from.

#### `colors(n, options)` (deprecated)

Picks colors from a d3 color scheme at the Cantor stops, optionally with HSL saturation and lightness by depth.
Use `palette({ hue: scheme })` instead, which gives more distinct colors for every scheme.

#### Measuring distinctness

`distance(a, b)` is the distance between two colors in OKLab, from 0 for equal colors to about 1 between black and white.
About 0.02 is just noticeable, and categories are easiest to tell apart at 0.04 or more.
`oklab(color)` and `oklch(color)` convert any CSS color.

How distinct a palette can be depends on the size of its region.
For example, the region inferred from `presets.mural` fits about 50 colors 0.05 apart, but only about 0.024 apart at 500 colors.
For many colors, widen `lightness` and `chroma`.

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
