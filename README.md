# C3 - Consistent Categorical Colors

A library to generate distinct categorical colors, written in TypeScript.

[Documentation](https://mapequation.github.io/c3)

### Install

`npm install @mapequation/c3`

### Features
* **Unlimited colors**: Generate as many colors you want
* **Any color scheme**: Hues come from the OKLCH hue circle or any [d3](https://github.com/d3/d3-scale-chromatic) color scheme.
* **Deterministic**: You always get the same colors for the same requested number of colors.
* **Consistent**: If you increase the number of colors, it doesn't change the list of colors you already have.
* **Fast**: `n` colors take time proportional to `n log(n)`. Choosing colors by distance, as with seeds, takes longer but stays within milliseconds for hundreds of colors.

### How it works

Every palette is drawn from one fixed, endless list of colors.
That is why the same request always gives the same colors, and asking for more never changes the ones you have.

Color number `i` (counting from 0) gets three numbers between 0 and 1 from
[van der Corput sequences](https://en.wikipedia.org/wiki/Van_der_Corput_sequence):
write `i` in a base and mirror its digits around the decimal point.

* **Hue** uses base 2: 0, 1/2, 1/4, 3/4, 1/8, 5/8, 3/8, 7/8, …
  Each round fills the middle of every gap left by the earlier colors, like the halving steps of the
  [Cantor set](https://en.wikipedia.org/wiki/Cantor_set), and the mirrored digits make consecutive colors land far apart.
  We call these numbers the Cantor stops. They are placed on the [OKLCH](https://bottosson.github.io/posts/oklab/) hue circle, or along a d3 color scheme.
* **Lightness** uses base 3: 0, 1/3, 2/3, 1/9, 4/9, …, scaled into the lightness range.
* **Chroma**, how colorful a color is, uses base 5, scaled into the chroma range.

Each base spreads its numbers evenly between 0 and 1.
Different prime bases keep the three from lining up: with base 2 for all of them, lightness would simply follow hue.
Together they form a [Halton sequence](https://en.wikipedia.org/wiki/Halton_sequence),
which spreads the colors evenly through the lightness and chroma ranges and all hues.

OKLCH is a color space where equal steps look about equally different.
Distances between colors are measured in its sibling OKLab, where 0.02 is about the smallest difference you can see.

**Choosing colors by distance.**
Taking the sequence in order is fast, but two colors can land close by chance.
`palette()` can instead choose each color by distance: among candidates from the sequence,
take the one whose closest already chosen color is farthest away.
The candidates are the first 4096 colors of the sequence (method `"farthest"`) or only the next 64 unused ones (`"lookahead"`).
Seeds are colors chosen before the first pick, so new colors land as far from them as possible.
Since the candidates are fixed and each choice depends only on the colors before it, this stays deterministic and consistent.

**Nested modules.**
`hierarchy()` colors the top modules with `palette()`, weighted by their flow.
Then each module gets a ball in OKLab: all colors within a radius of its color.
For every other module on the same level, the distance between the two is split in proportion to the square roots of their flows.
The radius is the smallest of these shares, made 20% smaller (`padding`) so that balls never touch.
The module's children are then chosen inside its ball, within the palette's lightness and chroma ranges, each as far as possible from its siblings, as with `"farthest"`.
So children look like their parent, differ from each other, and stay apart from their cousins.
A large module gets a large ball, with room for many distinct children.

### Usage

```js
import { palette, hierarchy, presets } from "@mapequation/c3";

// The first 20 colors of the sequence
palette(20);
palette(20, { hue: 40, lightness: [0.6, 0.8], chroma: [0.05, 0.15] });

// Hues from a d3 color scheme
palette(20, { hue: "Sinebow" });

// Start from hand-picked colors and add as distinct colors as possible
palette(50, { seeds: presets.mural });

// Nested modules: children vary around their parent's color
const color = hierarchy([
  { path: [1, 1], flow: 0.3 },
  { path: [1, 2], flow: 0.2 },
  { path: [2, 1], flow: 0.1 },
]);
color([1, 2]);
```

#### `palette(n, options)`

Returns `n` hex colors from the sequence described above.

`n` can also be an array of weights, such as module flows in descending order.
Each new Cantor stop then splits the gap between its two neighbors in proportion to their weights,
so heavy colors keep more free hue on both sides.
The space follows the weights but compressed: a color with half of the total weight gets about a third of the hue circle.

| Option | Default | |
|---|---|---|
| `hue` | `125` | Hue of the first color in degrees, going toward lower hues, or a d3 scheme name or interpolator to take hues from |
| `offset` | `0` | Shift the Cantor stops along the hue circle or scheme, from 0 to 1 |
| `reverse` | `false` | Go toward higher hues, or read the scheme from 1 to 0 |
| `lightness` | `[0.67, 0.83]` | OKLCH lightness range `[min, max]`, where 0 is black and 1 is white |
| `chroma` | `[0.045, 0.135]` | OKLCH chroma range `[min, max]`, where 0 is grey |
| `warmHue` | `285` | The hue that can get the most chroma |
| `tilt` | `0.15` | How much less chroma hues far from `warmHue` get: 0 for none, 1 for grey at the opposite hue |
| `like` | | Colors to infer `lightness`, `chroma`, `warmHue` and `tilt` from |
| `seeds` | | Colors to start with, see [Seeds and methods](#seeds-and-methods) |
| `method` | `"sequence"` | How the next color is chosen, see [Seeds and methods](#seeds-and-methods) |
| `end` | `false` | Lightness for later colors, see [End zone](#end-zone) |
| `lightnessOffset`, `chromaOffset` | `7`, `4` | Where in the base-3 and base-5 sequences to start. Changes the colors, not how evenly they spread |

With `hue` set to a scheme, `chroma`, `warmHue` and `tilt` are inferred from the middle 90% of the scheme's colors unless given.
`lightness` keeps its default, so the first colors have similar lightness.

#### Seeds and methods

`method` sets how the next color is chosen from the sequence:

* `"sequence"` (default) takes the colors in order.
  It never compares colors, so it is the fastest, and it spreads colors evenly through the ranges.
  Nothing prevents two colors from landing close by chance, though.
  It is the only method that uses weights, since weights move the Cantor stops and only matter in their order.
* `"farthest"` takes the first `candidates` (4096) colors of the sequence as candidates.
  Each new color is the candidate farthest from its nearest color so far.
  It gives the most distinct colors, about twice the smallest distance of `"sequence"`,
  but the farthest candidates lie at the edges of the ranges, so colors get more extreme.
  For `n` colors it takes time proportional to `n` times the number of candidates, so keep `n` well below it.
* `"lookahead"` does the same among only the next `lookahead` (64) unused colors of the sequence.
  It mostly follows the sequence but skips colors that would land too close, so it is in between in both distinctness and speed.

`seeds` are colors to start the palette with, such as a few hand-picked ones.
They come first and count toward `n`.
`lightness`, `chroma`, `warmHue` and `tilt` are inferred from them unless you give `like` or set them.
Seeds need `"farthest"` (the default with seeds) or `"lookahead"`, which choose new colors as far from the seeds as possible.
`presets.mural` holds five colors from the Englewood mural to start from.

#### End zone

The first colors matter most, but with many colors, later ones can land close to them.
`end` gives later colors their own lightness, the end zone, so they never look like the first ones.
They can be less distinct from each other.

| Option | Default | |
|---|---|---|
| `end` | `false` | `"darker"`: 0.03 below the lightness range and 0.22 wide, but not below 0.3. `"lighter"`: the same above, but not above 0.95. `[min, max]`: your own lightness range. `false`: no end zone |
| `midpoint` | `"auto"` | How many colors stay in the lightness range before the end zone, or `"auto"` for as many as fit `minGap` apart |
| `minGap` | `0.04` | Smallest OKLab distance between those first colors with `"auto"` |
| `steepness` | `Infinity` | Switch to the end zone at once, or, with the `"sequence"` method, fade into it: the color at `k` times the midpoint moves `1 - 1/k^steepness` of the way, so for 4, 80% at 1.5 times and 94% at twice the midpoint |

How many colors stay before the end zone depends only on the colors, not on `n`, so asking for more colors never changes the earlier ones.
Darker is usually the better choice, since sRGB has more room for distinct colors there.

#### `hierarchy(modules, options)`

Colors for nested modules, such as an Infomap hierarchy.
Pass each module as `{ path, flow }`, where `path` is like `[1, 4, 3]` for the third submodule of the fourth submodule of module 1.
Missing parents are added, with the sum of their children's flow.
Without flow, all modules count equally.

Top modules get `palette()` colors, weighted by flow, and `palette()` options apply to them, including `seeds` and `method`.
Each module then gets a ball in OKLab around its color: all colors within a radius of it.
Its radius splits the distance to every other module on the same level by the square root of their flows, minus `padding` (default `0.2`),
so large modules have room for distinct submodules and children stay apart from their cousins.
Children get colors as far apart as possible inside their parent's ball, in path order.

It returns a function from path to color.
For a path longer than the known modules, such as a node path, it gives the color of the deepest module on it.
Its `modules` property lists every module depth first with `path`, `flow`, `color` and the `radius` of its ball.
Adding a module never changes its earlier siblings or the modules above its level.
With module flows given, other modules only change if the new module is now closest to them, and then only their children change.

#### `colors(n, options)` (deprecated)

Picks colors from a d3 color scheme at the Cantor stops, optionally with HSL saturation and lightness by depth.
Use `palette({ hue: scheme })` instead, which keeps colors farther apart for every scheme: in our tests, the smallest distance between colors was 1.1 to 7 times larger, least for Turbo.
Its `skewness` option, which gives the first colors more hue space, is deprecated too: it only helps when colors differ in hue alone.

#### Measuring distinctness

`distance(a, b)` is the distance between two colors in OKLab, from 0 for equal colors to about 1 between black and white.
About 0.02 is just noticeable, and categories are easiest to tell apart at 0.04 or more.
`oklab(color)` and `oklch(color)` convert any CSS color.

How distinct a palette can be depends on how wide its lightness and chroma ranges are.
For example, the ranges inferred from `presets.mural` fit about 50 colors 0.05 apart, but 500 colors only about 0.024 apart.
For many colors, widen `lightness` and `chroma`, or add an end zone.

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
