import { defaultHierarchyOptions, defaultPaletteOptions, defaultRegion } from "@mapequation/c3";

/** Option or parameter: name, type, default, description. Text may use `code`. */
export type Row = [name: string, type: string, def: string, description: string];

export type ApiEntry = {
  name: string;
  /** What to use instead, for deprecated functions */
  deprecated?: string;
  signature: string;
  description: string[];
  params?: Row[];
  options?: Row[];
  returns: string;
  example: string;
};

const fmt = (value: unknown): string =>
  Array.isArray(value) ? `[${value.join(", ")}]` : value === Infinity ? "Infinity" : JSON.stringify(value);

const rangeRows: Row[] = [
  ["lightness", "[min, max]", fmt(defaultRegion.lightness), "OKLCH lightness range, where 0 is black and 1 is white."],
  ["chroma", "[min, max]", fmt(defaultRegion.chroma), "OKLCH chroma range, where 0 is grey. Chroma is how colorful a color is."],
  ["warmHue", "number", fmt(defaultRegion.warmHue), "The hue in degrees that can get the most chroma."],
  [
    "tilt",
    "number",
    fmt(defaultRegion.tilt),
    "How much less chroma hues far from `warmHue` get: 0 for none, 1 for grey at the opposite hue.",
  ],
];

const zoneRows: Row[] = [
  [
    "end",
    '"darker" | "lighter" | [min, max] | false',
    fmt(defaultPaletteOptions.end),
    'Lightness for later colors, so they never look like the first ones. `"darker"`: 0.03 below the lightness range and 0.22 wide, but not below 0.3. `"lighter"`: the same above, but not above 0.95. `[min, max]`: your own lightness range. `false`: none.',
  ],
  [
    "midpoint",
    'number | "auto"',
    fmt(defaultPaletteOptions.midpoint),
    'How many colors keep the lightness range before `end` takes over, or `"auto"` for as many as fit `minGap` apart.',
  ],
  ["minGap", "number", fmt(defaultPaletteOptions.minGap), 'Smallest OKLab distance between those first colors with `"auto"`.'],
  [
    "steepness",
    "number",
    fmt(defaultPaletteOptions.steepness),
    'Switch to `end` at once, or, with the `"sequence"` method, fade into it: the color at k times the midpoint moves 1 - 1/k^steepness of the way, so for 4, 80% at 1.5 times and 94% at twice the midpoint.',
  ],
];

export const API: ApiEntry[] = [
  {
    name: "palette",
    signature: "palette(n?, options?): string[]",
    description: [
      "Returns n hex colors from the Halton sequence described in How it works: hue from the Cantor stops, lightness and chroma from base-3 and base-5 van der Corput sequences, within the lightness and chroma ranges.",
      '`method` sets how the next color is chosen. `"sequence"` takes the colors in order: the fastest, with an even spread, but two colors can land close by chance. `"farthest"` takes, among the first `candidates` colors of the sequence, the one farthest from its nearest color so far: the most distinct, about twice the smallest distance, but colors drift to the edges of the ranges. `"lookahead"` does the same among only the next `lookahead` unused colors, which mostly follows the sequence and lands in between.',
      'With `seeds`, the palette starts with your colors and picks new ones as far from them as possible. With `end`, later colors get their own lightness so they never look like the first ones.',
    ],
    params: [
      [
        "n",
        "number | number[]",
        "16",
        'Number of colors, including seeds. Or, for the `"sequence"` method, weights such as module flows in descending order: each new Cantor stop splits the gap between its two neighbors in proportion to their weights, so heavy colors keep more free hue on both sides.',
      ],
    ],
    options: [
      [
        "hue",
        "number | SchemeName | (t) => string",
        fmt(defaultPaletteOptions.hue),
        "Hue of the first color in degrees, going toward lower hues. Or a d3 scheme name or interpolator to take the hue at each Cantor stop from.",
      ],
      ["offset", "number", fmt(defaultPaletteOptions.offset), "Shift the Cantor stops along the hue circle or scheme, from 0 to 1."],
      ["reverse", "boolean", fmt(defaultPaletteOptions.reverse), "Go toward higher hues, or read the scheme from 1 to 0."],
      ...rangeRows,
      [
        "like",
        "string[]",
        "",
        "Colors to infer `lightness`, `chroma`, `warmHue` and `tilt` from. With `hue` set to a scheme, `chroma`, `warmHue` and `tilt` come from the middle 90% of the scheme's colors unless given, and `lightness` keeps its default so the first colors have similar lightness.",
      ],
      [
        "seeds",
        "string[]",
        "",
        "Colors to start with, any CSS colors. They count toward n, and `lightness`, `chroma`, `warmHue` and `tilt` are inferred from them unless `like` or those options are given.",
      ],
      [
        "method",
        '"sequence" | "farthest" | "lookahead"',
        '"sequence"',
        'How the next color is chosen. `"farthest"` by default with seeds, which need `"farthest"` or `"lookahead"`.',
      ],
      ["candidates", "number", fmt(defaultPaletteOptions.candidates), 'How many colors of the sequence `"farthest"` chooses from. Keep n well below it.'],
      ["lookahead", "number", fmt(defaultPaletteOptions.lookahead), 'How many upcoming colors of the sequence `"lookahead"` chooses from.'],
      ...zoneRows,
      [
        "lightnessOffset, chromaOffset",
        "number",
        `${fmt(defaultPaletteOptions.lightnessOffset)}, ${fmt(defaultPaletteOptions.chromaOffset)}`,
        "Where in the base-3 and base-5 sequences to start. Changes the colors, not how evenly they spread.",
      ],
    ],
    returns: "Hex color strings.",
    example: `palette(20);\npalette(20, { hue: "Sinebow" });\npalette(20, { hue: 40, lightness: [0.6, 0.8], chroma: [0.05, 0.15] });\npalette(50, { seeds: presets.mural });\npalette(100, { end: "darker" });`,
  },
  {
    name: "hierarchy",
    signature: "hierarchy(modules, options?): (path) => string",
    description: [
      "Colors for nested modules, such as an Infomap hierarchy. Top modules get `palette()` colors weighted by flow. Each module then gets a ball in OKLab around its color, all colors within a radius of it. The radius splits the distance to every other module on the same level by the square root of their flows, minus `padding`. Children get colors as far apart as possible inside their parent's ball, in path order.",
      "So large modules have room for distinct submodules, and children stay closer to their parent than to their cousins. Adding a module never changes its earlier siblings or the modules above its level.",
    ],
    params: [
      [
        "modules",
        "{ path: number[]; flow?: number }[]",
        "",
        "Modules by path, like `[1, 4, 3]` for the third submodule of the fourth submodule of module 1. Missing parents are added with the sum of their children's flow; without flow, all modules count equally.",
      ],
    ],
    options: [
      ["padding", "number", fmt(defaultHierarchyOptions.padding), "Fraction of the space between two modules left empty, between cousins."],
      ["…", "PaletteOptions", "", "`palette()` options for the top modules, such as `hue`, `seeds`, `method` and zones. Children stay within the palette's lightness and chroma."],
    ],
    returns: "A function from path to hex color. A longer path, such as a node path, gives the color of its deepest module; an unknown path gives `undefined`. Its `modules` property lists every module depth first with `path`, `flow`, `color` and the `radius` of its ball.",
    example: `const color = hierarchy([\n  { path: [1, 1], flow: 0.3 },\n  { path: [1, 2], flow: 0.2 },\n  { path: [2, 1], flow: 0.1 },\n]);\ncolor([1, 2]); // a color near module 1's\ncolor([1, 2, 7]); // node 7 in module 1:2, the same color`,
  },
  {
    name: "stops",
    signature: "stops(n?, options?): Interval[]",
    description: [
      "Subdivides an interval recursively like the Cantor set. Each stop's `start` is a position on the interval: 0, 1/2, 1/4, 3/4, 1/8, and so on for equal weights. Use them with any color scale, or pass them to `colors()`.",
    ],
    params: [["n", "number | number[]", "10", "Number of stops, or weights: each new stop splits an interval in proportion to the weights of its two ends."]],
    options: [
      ["start, end", "number", "0, 1", "Interval to subdivide."],
      ["strength", "number", "0 or 1", "How much weights skew the split points: 0 for a count, 1 for weights."],
      ["skewness", "number", "1", "Deprecated. Exponential weights for a count, used when `strength` > 0. Only helps when colors differ in hue alone."],
    ],
    returns: "`Node` objects with `start`, `end` and their depth in the subdivision.",
    example: `stops(4).map((s) => s.start); // [0, 0.5, 0.25, 0.75]`,
  },
  {
    name: "inferRegion",
    signature: "inferRegion(colors): { lightness, chroma, warmHue, tilt }",
    description: [
      "The `palette()` options that describe a set of colors: the lightness and chroma ranges they span, widened to at least 0.1 and 0.04, the hue with the most chroma as `warmHue`, and how much less chroma the other hues have as `tilt`. `palette()` uses it for `like` and `seeds`.",
    ],
    params: [["colors", "string[]", "", "Any CSS colors."]],
    returns: "`{ lightness, chroma, warmHue, tilt }`, ready to pass to `palette()`.",
    example: `inferRegion(presets.mural);\n// { lightness: [0.648, 0.818], chroma: [0.029, 0.119], warmHue: 40.3, tilt: 0.5 }`,
  },
  {
    name: "distance",
    signature: "distance(a, b): number",
    description: [
      "Euclidean distance between two colors in OKLab, from 0 for equal colors to about 1 between black and white. About 0.02 is just noticeable; for categories that should be easy to tell apart, aim for 0.04 or more.",
    ],
    params: [["a, b", "string", "", "Any CSS colors."]],
    returns: "The distance. Throws on invalid colors.",
    example: `distance("#afb581", "#efab6a"); // 0.095`,
  },
  {
    name: "oklch",
    signature: "oklch(color): [L, C, H]",
    description: ["Converts any CSS color to OKLCH lightness, chroma and hue in degrees."],
    params: [["color", "string", "", "A CSS color, such as a hex, rgb() or named color."]],
    returns: "`[lightness, chroma, hue]`. Throws on invalid colors.",
    example: `oklch("#afb581"); // [0.755, 0.071, 113.5]`,
  },
  {
    name: "oklab",
    signature: "oklab(color): [L, a, b]",
    description: ["Converts any CSS color to OKLab, the perceptual color space that `distance()` and the `\"farthest\"` method measure distances in."],
    params: [["color", "string", "", "A CSS color, such as a hex, rgb() or named color."]],
    returns: "`[lightness, a, b]`. Throws on invalid colors.",
    example: `oklab("#afb581"); // [0.755, -0.028, 0.065]`,
  },
  {
    name: "presets",
    signature: "presets.mural: string[]",
    description: ["Colors for `palette({ seeds })` or `palette({ like })`. `mural` holds five colors from the Englewood mural."],
    returns: "Read-only arrays of hex colors.",
    example: `palette(20, { seeds: presets.mural });`,
  },
  {
    name: "colors",
    signature: "colors(n?, options?): string[]",
    deprecated: "Use `palette({ hue: scheme })`, which keeps colors farther apart for every scheme: in our tests, the smallest distance between colors was 1.1 to 7 times larger.",
    description: [
      "Picks colors from a d3 color scheme at the Cantor stops. Set `saturation` or `lightness` to override them in HSL, interpolated along a sigmoid of the Cantor depth from the start to the end value.",
      "O(n log n) for n colors.",
    ],
    params: [["n", "number | number[] | Interval[]", "16", "Number of colors, an array of weights, or intervals from `stops()`."]],
    options: [
      ["scheme", "SchemeName | (t) => string", '"Rainbow"', "A d3-scale-chromatic scheme name or any interpolator on [0, 1]."],
      ["offset", "number", "0", "Shift all stops along the scheme, wrapping around at 1."],
      ["reverse", "boolean", "false", "Read the scheme from 1 to 0."],
      ["start, end", "number", "0, 1", "Interval of the scheme to use."],
      ["saturation", "number", "", "HSL saturation of the first colors. Defaults to 0.8 when only `lightness` is set."],
      ["saturationEnd", "number", "saturation", "HSL saturation that deeper colors approach. 1 when `saturation` is unset."],
      ["lightness", "number", "", "HSL lightness of the first colors. Defaults to 0.6 when only `saturation` is set."],
      ["lightnessEnd", "number", "lightness", "HSL lightness that deeper colors approach. 0.4 when `lightness` is unset."],
      ["midpoint", "number", "4", "Cantor depth where the sigmoid is halfway between start and end."],
      ["steepness", "number", "1", "Steepness of the sigmoid."],
      ["strength", "number", "0 or 1", "How much weights skew the stops: 0 for a count, 1 for weights."],
      ["skewness", "number", "0", "Deprecated. Exponential weights for a count, used when `strength` > 0."],
    ],
    returns: "CSS `rgb()` color strings.",
    example: `colors(20, { scheme: "Sinebow" });\ncolors([5, 1, 3, 2], { scheme: "Spectral" });`,
  },
];
