import { defaultExtendOptions, defaultHierarchyOptions, defaultPaletteOptions, defaultRegion } from "@mapequation/c3";

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

const fmt = (value: unknown): string => (Array.isArray(value) ? `[${value.join(", ")}]` : JSON.stringify(value));

const regionRows: Row[] = [
  ["lightness", "[min, max]", fmt(defaultRegion.lightness), "OKLCH lightness range, 0 is black and 1 is white."],
  ["chroma", "[min, max]", fmt(defaultRegion.chroma), "OKLCH chroma range, 0 is grey."],
  ["warmHue", "number", fmt(defaultRegion.warmHue), "Hue in degrees where chroma can reach the top of its range."],
  [
    "tilt",
    "number",
    fmt(defaultRegion.tilt),
    "From 0 to 1: how much the chroma range shrinks for hues away from `warmHue`. At 1, the opposite hue is grey.",
  ],
];

const zoneRows: Row[] = [
  ["end", "Region | false", "lighter", "Region for colors after the top zone. Left-out fields come from the default: lighter than the top region, or darker or greyer if it is already light. `false` turns zones off."],
  ["midpoint", 'number | "auto"', fmt(defaultPaletteOptions.midpoint), "Number of colors in the top zone, or as many as fit `minGap` apart."],
  ["minGap", "number", fmt(defaultPaletteOptions.minGap), "Smallest OKLab distance between top zone colors for `\"auto\"`."],
];

export const API: ApiEntry[] = [
  {
    name: "palette",
    signature: "palette(n?, options?): string[]",
    description: [
      "Spreads colors over a region of OKLCH color space. Hue comes from the Cantor stops, lightness from a base-3 and chroma from a base-5 van der Corput sequence. Together they form a Halton sequence, which fills the region evenly and never moves earlier colors when extended.",
      "Zones keep the first colors distinct however many you ask for. The top zone holds the first colors, by default as many as fit `minGap` apart. Later colors come from the `end` region, by default lighter than the top region (darker or greyer if it is already light), so they never look like the first ones. The boundary depends only on the region, not on n.",
      "O(n log n) for n colors.",
    ],
    params: [["n", "number | number[]", "16", "Number of colors, or weights such as module flows in descending order. Each new stop splits the hue between its two neighbors in proportion to their weights, so heavy colors keep more free hue on both sides."]],
    options: [
      [
        "hue",
        "number | SchemeName | (t) => string",
        fmt(defaultPaletteOptions.hue),
        "Hue of the first color in degrees, going toward lower hues. Or a d3 scheme name or interpolator to take the hue at each stop from.",
      ],
      ["offset", "number", fmt(defaultPaletteOptions.offset), "Shift the stops along the hue circle or scheme, from 0 to 1."],
      ["reverse", "boolean", fmt(defaultPaletteOptions.reverse), "Go toward higher hues, or read the scheme from 1 to 0."],
      ...regionRows,
      [
        "like",
        "string[]",
        "",
        "Infer `lightness`, `chroma`, `warmHue` and `tilt` from these colors. For a scheme, `chroma`, `warmHue` and `tilt` come from the center 90% of the scheme's own colors and `lightness` keeps its default, so the first colors have similar lightness. Explicit options win.",
      ],
      [
        "lightnessOffset",
        "number",
        fmt(defaultPaletteOptions.lightnessOffset),
        "Start index in the lightness sequence. Changes the colors, not their spacing.",
      ],
      ["chromaOffset", "number", fmt(defaultPaletteOptions.chromaOffset), "Start index in the chroma sequence."],
      ...zoneRows,
      ["steepness", "number", fmt(defaultPaletteOptions.steepness), "How quickly colors after the midpoint move to the end region: 80% of the way at 1.5 times the midpoint and 94% at twice it. `Infinity` switches at once, which keeps them furthest from the top zone."],
    ],
    returns: "Hex color strings.",
    example: `palette(20);\npalette(20, { hue: "Sinebow" });\npalette(20, { hue: 40, lightness: [0.6, 0.8], chroma: [0.05, 0.15] });\npalette(100, { end: { lightness: [0.4, 0.6] }, midpoint: 30 });`,
  },
  {
    name: "extend",
    signature: "extend(seeds, n, options?): string[]",
    description: [
      "Returns the seed colors followed by new colors, `n` in total. Each new color is as far as possible from all colors before it, measured in OKLab. The region to pick from is inferred from the seeds with `inferRegion()` unless you pass region options. It takes the same zone options as `palette()`, except `steepness`.",
      'With n new colors, `method: "greedy"` takes O(n · candidates): each color scans a fixed set of candidates. It gives the most distinct colors, which tend toward the edges of the region, and n should stay well below the number of candidates.',
      '`method: "halton"` takes O(n · window + n²): each color is the farthest of the next `window` points along a Halton sequence, and each point is compared once with the colors before it. The n² term has a small constant, so it is several times faster than greedy for a few hundred colors, and colors spread more evenly inside the region.',
    ],
    params: [
      ["seeds", "string[]", "", "Colors to keep first, any CSS color."],
      ["n", "number", "", "Total number of colors, including the seeds."],
    ],
    options: [
      ["method", '"greedy" | "halton"', fmt(defaultExtendOptions.method), "How new colors are picked."],
      ["candidates", "number", fmt(defaultExtendOptions.candidates), "Number of candidate colors for the greedy method."],
      ["window", "number", fmt(defaultExtendOptions.window), "Halton points considered per color for the halton method."],
      ["hue", "number", fmt(defaultExtendOptions.hue), "Hue offset in degrees for the candidate sequence."],
      ...regionRows.map(([name, type, , description]): Row => [name, type, "inferred", description]),
      ...zoneRows,
    ],
    returns: "Hex color strings, starting with the seeds.",
    example: `extend(presets.mural, 50);\nextend(["#e78c6e", "#838eab"], 20, { method: "halton" });\nextend(presets.mural, 30, { tilt: 0 });`,
  },
  {
    name: "hierarchy",
    signature: "hierarchy(modules, options?): (path) => string",
    description: [
      "Colors for nested modules, such as an Infomap hierarchy. Top modules get `palette()` colors weighted by flow. Each module then gets a ball in OKLab around its color: its radius splits the distance to every other module on the same level by the square root of their flows, minus `padding`. Children get colors as far apart as possible inside their parent's ball, in path order.",
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
      ["…", "PaletteOptions", "", "`palette()` options for the top modules, such as `hue` and zones. Children stay within the palette's lightness and chroma."],
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
    signature: "inferRegion(colors): Region",
    description: [
      "The lightness and chroma ranges that the colors span, widened to at least 0.1 and 0.04, and the hue where chroma is highest. `tilt` is half of what a least-squares fit of chroma against hue gives, because a few colors overstate it.",
    ],
    params: [["colors", "string[]", "", "Any CSS colors."]],
    returns: "`{ lightness, chroma, warmHue, tilt }`, the region options of `palette()` and `extend()`.",
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
    description: ["Converts any CSS color to OKLab, the perceptual color space that `extend()` measures distances in."],
    params: [["color", "string", "", "A CSS color, such as a hex, rgb() or named color."]],
    returns: "`[lightness, a, b]`. Throws on invalid colors.",
    example: `oklab("#afb581"); // [0.755, -0.028, 0.065]`,
  },
  {
    name: "presets",
    signature: "presets.mural: string[]",
    description: ["Seed colors for `extend()` and `palette({ like })`. `mural` holds five colors from the Englewood mural."],
    returns: "Read-only arrays of hex colors.",
    example: `extend(presets.mural, 20);`,
  },
  {
    name: "colors",
    signature: "colors(n?, options?): string[]",
    deprecated: "Use `palette({ hue: scheme })`, which gives more distinct colors for every scheme.",
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
