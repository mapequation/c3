import { defaultExtendOptions, defaultPaletteOptions, defaultRegion } from "@mapequation/c3";

/** Option or parameter: name, type, default, description. Text may use `code`. */
export type Row = [name: string, type: string, def: string, description: string];

export type ApiEntry = {
  name: string;
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

export const API: ApiEntry[] = [
  {
    name: "colors",
    signature: "colors(n?, options?): string[]",
    description: [
      "Picks colors from a d3 color scheme at the Cantor stops. Set `saturation` or `lightness` to override them in HSL, interpolated along a sigmoid of the Cantor depth from the start to the end value.",
      "Set `vary` to also vary lightness and chroma in OKLCH with base-3 and base-5 van der Corput sequences. This makes hue-cycling schemes like Sinebow, Rainbow and Turbo noticeably more distinct.",
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
      ["skewness", "number", "0", "Exponential weights for a count, used when `strength` > 0."],
      [
        "vary",
        "boolean | number | { lightness, chroma }",
        "",
        "`true` varies lightness by ±0.1 and chroma by ±40%, a number scales that, an object sets them directly.",
      ],
    ],
    returns: "CSS `rgb()` color strings.",
    example: `colors(20, { scheme: "Sinebow" });\ncolors(20, { scheme: "Sinebow", vary: true });\ncolors([5, 1, 3, 2], { scheme: "Spectral" });`,
  },
  {
    name: "palette",
    signature: "palette(n?, options?): string[]",
    description: [
      "Spreads colors over a region of OKLCH color space. Hue comes from the Cantor stops, lightness from a base-3 and chroma from a base-5 van der Corput sequence. Together they form a Halton sequence, which fills the region evenly and never moves earlier colors when extended.",
      "O(n log n) for n colors.",
    ],
    params: [["n", "number | number[]", "16", "Number of colors or an array of weights."]],
    options: [
      ["hue", "number", fmt(defaultPaletteOptions.hue), "Hue of the first color in degrees."],
      ["reverse", "boolean", fmt(defaultPaletteOptions.reverse), "Go around the hue circle the other way."],
      ...regionRows,
      ["like", "string[]", "", "Infer `lightness`, `chroma`, `warmHue` and `tilt` from these colors. Explicit options win."],
      [
        "lightnessOffset",
        "number",
        fmt(defaultPaletteOptions.lightnessOffset),
        "Start index in the lightness sequence. Changes the colors, not their spacing.",
      ],
      ["chromaOffset", "number", fmt(defaultPaletteOptions.chromaOffset), "Start index in the chroma sequence."],
      ["strength, skewness", "number", "", "Passed to `stops()` for the hues."],
    ],
    returns: "Hex color strings.",
    example: `palette(20);\npalette(20, { hue: 40, lightness: [0.6, 0.8], chroma: [0.05, 0.15] });\npalette(20, { like: presets.mural });`,
  },
  {
    name: "extend",
    signature: "extend(seeds, n, options?): string[]",
    description: [
      "Returns the seed colors followed by new colors, `n` in total. Each new color is as far as possible from all colors before it, measured in OKLab. The region to pick from is inferred from the seeds with `inferRegion()` unless you pass region options.",
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
    ],
    returns: "Hex color strings, starting with the seeds.",
    example: `extend(presets.mural, 50);\nextend(["#e78c6e", "#838eab"], 20, { method: "halton" });\nextend(presets.mural, 30, { tilt: 0 });`,
  },
  {
    name: "stops",
    signature: "stops(n?, options?): Interval[]",
    description: [
      "Subdivides an interval recursively like the Cantor set. Each stop's `start` is a position on the interval: 0, 1/2, 1/4, 3/4, 1/8, and so on for equal weights. Use them with any color scale, or pass them to `colors()`.",
    ],
    params: [["n", "number | number[]", "10", "Number of stops or an array of weights."]],
    options: [
      ["start, end", "number", "0, 1", "Interval to subdivide."],
      ["strength", "number", "0 or 1", "How much weights skew the split points: 0 for a count, 1 for weights."],
      ["skewness", "number", "1", "Exponential weights for a count, used when `strength` > 0."],
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
    name: "oklch",
    signature: "oklch(color): [L, C, H]",
    description: ["Converts any CSS color to OKLCH lightness, chroma and hue in degrees."],
    params: [["color", "string", "", "A CSS color, such as a hex, rgb() or named color."]],
    returns: "`[lightness, chroma, hue]`. Throws on invalid colors.",
    example: `oklch("#afb581"); // [0.755, 0.071, 113.5]`,
  },
  {
    name: "presets",
    signature: "presets.mural: string[]",
    description: ["Seed colors for `extend()` and `palette({ like })`. `mural` holds five colors from the Englewood mural."],
    returns: "Read-only arrays of hex colors.",
    example: `extend(presets.mural, 20);`,
  },
];
