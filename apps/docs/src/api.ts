import { defaultEndZone, defaultHierarchyOptions, defaultPaletteOptions, defaultTone } from "@mapequation/c3/internal";
import { snake } from "./code";
import type { ByLang } from "./lang";

/** Text that is the same in JS and Python, or a pair. Text may use `code`. */
type Text = string | ByLang;

/** Option or parameter: name, type, default, description. Python names are in snake_case. */
export type Row = [name: string, type: Text, def: Text, description: Text];

export type ApiEntry = {
  name: string;
  /** What to use instead, for deprecated functions */
  deprecated?: string;
  signature: ByLang;
  description: Text[];
  params?: Row[];
  options?: Row[];
  /** The options table's caption, where the options aren't arguments */
  optionsCaption?: string;
  returns: Text;
  example: ByLang;
  /** How the Python port differs, beyond names and types */
  python?: string;
};

/** Python for code spans and types in the text, where it differs from the JS */
const PY_CODE: Record<string, string> = {
  "{ lightness: [0.6, 0.8] }": '{"lightness": (0.6, 0.8)}',
  '{ lightness: "darker" }': '{"lightness": "darker"}',
  "{ ...tones.pastel, chroma: [0.08, 0.12] }": '{**c3.tones["pastel"], "chroma": (0.08, 0.12)}',
  "tone: colors": "tone=colors",
  "Object.keys(tones)": "list(c3.tones)",
  "[lightness, chroma, hue]": "(lightness, chroma, hue)",
  "[lightness, a, b]": "(lightness, a, b)",
  "{ path: number[]; flow?: number }[]": "Sequence[Module]",
  "(t) => string": "Callable",
  "Partial<Tone>": "PartialTone",
  "[min, max]": "(min, max)",
  "string[]": "Sequence[str]",
  "number[]": "Sequence[float]",
  number: "float",
  string: "str",
  boolean: "bool",
  false: "False",
  true: "True",
  undefined: "None",
};

/** The Python version of a code span or type: known spans, types part by part, camelCase names in snake_case */
export function toPython(code: string): string {
  if (Object.hasOwn(PY_CODE, code)) return PY_CODE[code];
  if (code.includes(" | ")) return code.split(" | ").map(toPython).join(" | ");
  // palette({ tone }) is palette(tone=...)
  const option = code.match(/^(\w+)\(\{ (\w+) \}\)$/);
  if (option) return `${option[1]}(${option[2]}=...)`;
  return /^[a-z]+[A-Z]\w*(\(\))?$/.test(code) ? snake(code) : code;
}

/** The name of an option in Python: end zone options are keys of the end dict */
export const pythonName = (name: string) =>
  name.startsWith("end.") ? `end["${snake(name.slice(4))}"]` : snake(name);

/** A default value in JS and Python, where ranges are tuples */
const fmt = (value: unknown): ByLang => ({
  js: Array.isArray(value) ? `[${value.join(", ")}]` : value === Infinity ? "Infinity" : JSON.stringify(value),
  py: Array.isArray(value)
    ? `(${value.join(", ")})`
    : value === Infinity
      ? "math.inf"
      : typeof value === "boolean"
        ? value ? "True" : "False"
        : JSON.stringify(value),
});

const INT = { js: "number", py: "int" };

const toneRows: Row[] = [
  ["lightness", "[min, max]", fmt(defaultTone.lightness), "OKLCH lightness range, where 0 is black and 1 is white."],
  ["chroma", "[min, max]", fmt(defaultTone.chroma), "OKLCH chroma range, where 0 is grey. Chroma is how colorful a color is."],
  ["warmHue", "number", fmt(defaultTone.warmHue), "The hue in degrees that can get the most chroma."],
  [
    "tilt",
    "number",
    fmt(defaultTone.tilt),
    "How much less chroma hues far from `warmHue` get: 0 for none, 1 for grey at the opposite hue.",
  ],
];

const endRows: Row[] = ([
  [
    "lightness",
    '"darker" | "lighter" | [min, max]',
    fmt(defaultEndZone.lightness),
    '`"darker"`: 0.03 below the tone\'s lightness range and 0.22 wide, but not below 0.3. `"lighter"`: the same above, but not above 0.95. `[min, max]`: your own lightness range.',
  ],
  [
    "midpoint",
    'number | "auto"',
    fmt(defaultEndZone.midpoint),
    'How many colors stay in the tone before the end zone, or `"auto"` for as many as fit `minGap` apart.',
  ],
  ["minGap", "number", fmt(defaultEndZone.minGap), 'Smallest OKLab distance between those first colors with `"auto"`.'],
  [
    "steepness",
    "number",
    fmt(defaultEndZone.steepness),
    'Switch to the end zone at once, or, with the `"sequence"` method, fade into it: the color at k times the midpoint moves 1 - 1/k^steepness of the way, so for 4, 80% at 1.5 times and 94% at twice the midpoint.',
  ],
] as Row[]).map(([name, ...rest]) => [`end.${name}`, ...rest] as Row);

export const API: ApiEntry[] = [
  {
    name: "palette",
    signature: { js: "palette(n?, options?): string[]", py: "palette(n=16, **options) -> list[str]" },
    description: [
      "Returns n hex colors from the Halton sequence described in How it works: hue from the Cantor stops, lightness and chroma from base-3 and base-5 van der Corput sequences, within the tone's lightness and chroma ranges.",
      '`method` sets how the next color is chosen. `"sequence"` takes the colors in order: the fastest, with an even spread, but two colors can land close by chance. `"farthest"` takes, among the first `candidates` colors of the sequence, the one farthest from its nearest color so far: the most distinct, about twice the smallest distance, but colors drift to the edges of the ranges. `"lookahead"` does the same among only the next `lookahead` unused colors, which mostly follows the sequence and lands in between.',
      'With `seeds`, the palette starts with your colors and picks new ones as far from them as possible. With `end`, later colors get their own lightness, the end zone, so they never look like the first ones.',
    ],
    params: [
      [
        "n",
        { js: "number | number[]", py: "int | Sequence[float]" },
        "16",
        'Number of colors, including seeds. Or, for the `"sequence"` method, weights such as module flows in descending order: each new Cantor stop splits the gap between its two neighbors in proportion to their weights, so heavy colors keep more free hue on both sides.',
      ],
    ],
    options: [
      [
        "hue",
        '"Oklch" | SchemeName | (t) => string',
        fmt(defaultPaletteOptions.hue),
        {
          js: 'Where hues come from: `"Oklch"` for the OKLCH hue circle, or a d3 scheme name or interpolator to take the hue at each Cantor stop from.',
          py: 'Where hues come from: `"Oklch"` for the OKLCH hue circle, the d3 scheme `"Turbo"`, `"Sinebow"` or `"Rainbow"`, or any callable from t in [0, 1] to a CSS color or (r, g, b) floats, such as `matplotlib.colormaps["viridis"]`, to take the hue at each Cantor stop from.',
        },
      ],
      [
        "offset",
        "number",
        `${defaultPaletteOptions.offset} on "Oklch", 0 on a scheme`,
        'Where the first color sits, in degrees around the hue source: its hue on `"Oklch"`, where later colors go toward lower hues. On a scheme, 360 is the whole scheme.',
      ],
      ["reverse", "boolean", fmt(defaultPaletteOptions.reverse), "Go toward higher hues, or read the scheme from 1 to 0."],
      [
        "tone",
        'ToneName | string[] | Partial<Tone>',
        '"strong"',
        'Lightness and chroma of the colors: a tone name (`"vivid"`, `"bright"`, `"strong"`, `"deep"`, `"dark"`, `"soft"`, `"pastel"` or `"muted"`), colors to infer the tone from, or the tone\'s fields over the base tone, such as `{ lightness: [0.6, 0.8] }`. The base tone is inferred from `seeds` if given, else from a d3 scheme set as `hue` (`chroma`, `warmHue` and `tilt` from the middle 90% of its colors, `lightness` from `"strong"`), else it is `"strong"`.',
      ],
      [
        "seeds",
        "string[]",
        "",
        "Colors to start with, any CSS colors. They count toward n, and the tone is inferred from them unless you give `tone`.",
      ],
      [
        "method",
        '"sequence" | "farthest" | "lookahead"',
        '"sequence"',
        'How the next color is chosen. `"farthest"` by default with seeds, which need `"farthest"` or `"lookahead"`.',
      ],
      ["candidates", INT, fmt(defaultPaletteOptions.candidates), 'How many colors of the sequence `"farthest"` chooses from. Keep n well below it.'],
      ["lookahead", INT, fmt(defaultPaletteOptions.lookahead), 'How many upcoming colors of the sequence `"lookahead"` chooses from.'],
      [
        "end",
        '"darker" | "lighter" | [min, max] | EndZone | false',
        fmt(defaultPaletteOptions.end),
        {
          js: 'Lightness for later colors, the end zone, so they never look like the first ones. `"darker"` is short for `{ lightness: "darker" }`. `false`: none. An object takes the `end.` options below.',
          py: 'Lightness for later colors, the end zone, so they never look like the first ones. `"darker"` is short for `{"lightness": "darker"}`. `False`: none. A dict takes the `end` keys below.',
        },
      ],
      ...endRows,
      [
        "lightnessOffset, chromaOffset",
        "number",
        `${defaultPaletteOptions.lightnessOffset}, ${defaultPaletteOptions.chromaOffset}`,
        "Where in the base-3 and base-5 sequences to start. Changes the colors, not how evenly they spread.",
      ],
    ],
    returns: { js: "Hex color strings.", py: "A list of hex color strings." },
    example: {
      js: `palette(20);\npalette(20, { hue: "Sinebow" });\npalette(20, { tone: "pastel", offset: 40 });\npalette(20, { tone: { ...tones.vivid, lightness: [0.6, 0.7] } });\npalette(50, { seeds: swatches.mural });\npalette(100, { end: "darker" });`,
      py: `c3.palette(20)\nc3.palette(20, hue="Sinebow")\nc3.palette(20, tone="pastel", offset=40)\nc3.palette(20, tone={**c3.tones["vivid"], "lightness": (0.6, 0.7)})\nc3.palette(50, seeds=c3.swatches["mural"])\nc3.palette(100, end="darker")\nc3.palette(20, hue=matplotlib.colormaps["viridis"])`,
    },
    python:
      'Options are keyword-only arguments. By name, `hue` takes only `"Oklch"`, `"Turbo"`, `"Sinebow"` and `"Rainbow"`; the other d3 scheme names raise a `ValueError`. Pass the scheme as a callable instead, such as a matplotlib colormap, whose colors can differ slightly from d3\'s.',
  },
  {
    name: "hierarchy",
    signature: { js: "hierarchy(modules, options?): (path) => string", py: "hierarchy(modules, **options) -> Hierarchy" },
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
      ["…", { js: "PaletteOptions", py: "keyword arguments" }, "", "`palette()` options for the top modules, such as `tone`, `hue`, `seeds`, `method` and `end`. Children stay within the tone's lightness and chroma ranges."],
    ],
    returns: {
      js: "A function from path to hex color. A longer path, such as a node path, gives the color of its deepest module; an unknown path gives `undefined`. Its `modules` property lists every module depth first with `path`, `flow`, `color` and the `radius` of its ball.",
      py: "A `Hierarchy`, callable from path to hex color. A longer path, such as a node path, gives the color of its deepest module; an unknown path gives `None`. Its `modules` attribute lists every module depth first as a dict with `path`, `flow`, `color` and the `radius` of its ball.",
    },
    python: "Modules are dicts, and the result is a `Hierarchy` object rather than a function.",
    example: {
      js: `const color = hierarchy([\n  { path: [1, 1], flow: 0.3 },\n  { path: [1, 2], flow: 0.2 },\n  { path: [2, 1], flow: 0.1 },\n]);\ncolor([1, 2]); // a color near module 1's\ncolor([1, 2, 7]); // node 7 in module 1:2, the same color`,
      py: `color = c3.hierarchy([\n    {"path": [1, 1], "flow": 0.3},\n    {"path": [1, 2], "flow": 0.2},\n    {"path": [2, 1], "flow": 0.1},\n])\ncolor([1, 2])  # a color near module 1's\ncolor([1, 2, 7])  # node 7 in module 1:2, the same color\n[m["color"] for m in color.modules]  # all module colors, depth first`,
    },
  },
  {
    name: "tones",
    signature: { js: "tones: Record<ToneName, Tone>", py: "tones: dict[str, Tone]" },
    description: [
      "Named tones for `palette({ tone })`: vivid, bright, strong (the default), deep, dark, soft, pastel and muted. A tone is the part of OKLCH the colors come from: a lightness and a chroma range. `Object.keys(tones)` lists the names. The sRGB gamut caps chroma below the range for some hues, most for cyan in the colorful tones.",
      "Start from a named tone with `{ ...tones.pastel, chroma: [0.08, 0.12] }`. These are the fields of a tone:",
    ],
    options: toneRows,
    optionsCaption: "Fields",
    returns: {
      js: "Read-only tones, each `{ lightness, chroma, warmHue, tilt }`.",
      py: "Tones, each a dict with `lightness`, `chroma`, `warm_hue` and `tilt`.",
    },
    python: 'The tones are plain dicts: copy one, as with `{**c3.tones["pastel"]}`, rather than changing it.',
    example: {
      js: `palette(20, { tone: "pastel" });\npalette(20, { tone: { ...tones.pastel, chroma: [0.08, 0.12] } });`,
      py: `c3.palette(20, tone="pastel")\nc3.palette(20, tone={**c3.tones["pastel"], "chroma": (0.08, 0.12)})`,
    },
  },
  {
    name: "inferTone",
    signature: { js: "inferTone(colors): Tone", py: "infer_tone(colors) -> Tone" },
    description: [
      "The tone that describes a set of colors: the lightness and chroma ranges they span, widened to at least 0.1 and 0.04, the hue with the most chroma as `warmHue`, and how much less chroma the other hues have as `tilt`. `palette()` uses it for `tone: colors` and `seeds`.",
    ],
    params: [["colors", "string[]", "", "Any CSS colors."]],
    returns: {
      js: "`{ lightness, chroma, warmHue, tilt }`, ready to pass as `tone`.",
      py: "A dict with `lightness`, `chroma`, `warm_hue` and `tilt`, ready to pass as `tone`.",
    },
    example: {
      js: `inferTone(swatches.mural);\n// { lightness: [0.648, 0.818], chroma: [0.029, 0.119], warmHue: 40.3, tilt: 0.5 }`,
      py: `c3.infer_tone(c3.swatches["mural"])\n# {'lightness': (0.648, 0.818), 'chroma': (0.029, 0.119), 'warm_hue': 40.3, 'tilt': 0.5}`,
    },
  },
  {
    name: "distance",
    signature: { js: "distance(a, b): number", py: "distance(a, b) -> float" },
    description: [
      "Euclidean distance between two colors in OKLab, from 0 for equal colors to about 1 between black and white. About 0.02 is just noticeable; for categories that should be easy to tell apart, aim for 0.04 or more.",
    ],
    params: [["a, b", "string", "", "Any CSS colors."]],
    returns: { js: "The distance. Throws on invalid colors.", py: "The distance. Raises `ValueError` for invalid colors." },
    example: { js: `distance("#afb581", "#efab6a"); // 0.095`, py: `c3.distance("#afb581", "#efab6a")  # 0.095` },
  },
  {
    name: "oklch",
    signature: { js: "oklch(color): [L, C, H]", py: "oklch(color) -> tuple[float, float, float]" },
    description: ["Converts any CSS color to OKLCH lightness, chroma and hue in degrees."],
    params: [["color", "string", "", "A CSS color, such as a hex, rgb() or named color."]],
    returns: { js: "`[lightness, chroma, hue]`. Throws on invalid colors.", py: "`(lightness, chroma, hue)`. Raises `ValueError` for invalid colors." },
    example: { js: `oklch("#afb581"); // [0.755, 0.071, 113.5]`, py: `c3.oklch("#afb581")  # (0.755, 0.071, 113.5)` },
  },
  {
    name: "oklab",
    signature: { js: "oklab(color): [L, a, b]", py: "oklab(color) -> tuple[float, float, float]" },
    description: ["Converts any CSS color to OKLab, the perceptual color space that `distance()` and the `\"farthest\"` method measure distances in."],
    params: [["color", "string", "", "A CSS color, such as a hex, rgb() or named color."]],
    returns: { js: "`[lightness, a, b]`. Throws on invalid colors.", py: "`(lightness, a, b)`. Raises `ValueError` for invalid colors." },
    example: { js: `oklab("#afb581"); // [0.755, -0.028, 0.065]`, py: `c3.oklab("#afb581")  # (0.755, -0.028, 0.065)` },
  },
  {
    name: "swatches",
    signature: { js: "swatches.mural: string[]", py: 'swatches["mural"]: tuple[str, ...]' },
    description: ["Colors for `palette({ seeds })` or `palette({ tone })`. `mural` holds five colors from the Englewood mural."],
    returns: { js: "Read-only arrays of hex colors.", py: "Tuples of hex colors." },
    example: { js: `palette(20, { seeds: swatches.mural });`, py: `c3.palette(20, seeds=c3.swatches["mural"])` },
  },
];
