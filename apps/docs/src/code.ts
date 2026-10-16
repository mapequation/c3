import { swatches } from "@mapequation/c3";
import type { ByLang } from "./lang";
import { round } from "./util";

const MAX_LINE = 60;

/** Code printed as is, like a variable name */
export class Raw {
  constructor(readonly code: string) {}
}

function format(value: unknown, indent: string): string {
  if (value instanceof Raw) return value.code;
  if (value === swatches.mural) return "swatches.mural";
  if (typeof value === "number") return String(round(value));
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => format(v, indent)).join(", ")}]`;
  if (value && typeof value === "object") {
    const parts = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${format(v, `${indent}  `)}`);
    if (parts.length === 0) return "{}";
    const line = `{ ${parts.join(", ")} }`;
    if (indent.length + line.length <= MAX_LINE) return line;
    return `{\n${parts.map((p) => `${indent}  ${p},`).join("\n")}\n${indent}}`;
  }
  return String(value);
}

function jsCode(fn: string, args: unknown[]) {
  const last = format(args.at(-1), "");
  const shown = last === "{}" ? args.slice(0, -1) : args;
  const call = `${fn}(${shown.map((a) => format(a, "")).join(", ")});`;
  const names = [fn, ...(call.includes("swatches.") ? ["swatches"] : [])];
  return `import { ${names.join(", ")} } from "@mapequation/c3";\n\n${call}`;
}

/** Python names: warmHue is warm_hue */
export const snake = (name: string) => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** The hue sources the Python port has by name */
const PY_HUES = ["Oklch", "Turbo", "Sinebow", "Rainbow"];

/** matplotlib colormaps for the other d3 schemes: the ColorBrewer ones have the same name */
const COLORMAPS: Record<string, string> = {
  Viridis: "viridis",
  Cividis: "cividis",
  CubehelixDefault: "cubehelix",
  ...Object.fromEntries(
    "BrBG PRGn PiYG PuOr RdBu RdGy RdYlBu RdYlGn Spectral Blues Greens Greys Oranges Purples Reds BuGn BuPu GnBu OrRd PuBuGn PuBu PuRd RdPu YlGnBu YlGn YlOrBr YlOrRd"
      .split(" ")
      .map((name) => [name, name]),
  ),
};

/** Items on one line if they fit, else one per line with a trailing comma */
function wrap(open: string, parts: string[], close: string, indent: string) {
  const line = `${open}${parts.join(", ")}${close}`;
  if (parts.length === 0 || indent.length + line.length <= MAX_LINE) return line;
  return `${open}\n${parts.map((p) => `${indent}    ${p},`).join("\n")}\n${indent}${close}`;
}

/** Python for a value, adding the modules it needs to imports */
function pyFormat(value: unknown, indent: string, imports: Set<string>): string {
  if (value instanceof Raw) return value.code;
  if (value === swatches.mural) return 'c3.swatches["mural"]';
  if (typeof value === "boolean") return value ? "True" : "False";
  if (value === Infinity) {
    imports.add("math");
    return "math.inf";
  }
  if (typeof value === "number") return String(round(value));
  if (typeof value === "string") return JSON.stringify(value);
  const inner = `${indent}    `;
  if (Array.isArray(value)) return wrap("[", value.map((v) => pyFormat(v, inner, imports)), "]", indent);
  if (value && typeof value === "object") {
    const parts = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `"${snake(k)}": ${pyFormat(v, inner, imports)}`);
    return wrap("{", parts, "}", indent);
  }
  return "None";
}

/** The hue option in Python: a name the port has, else the matplotlib colormap of the same scheme */
function pyHue(hue: unknown, imports: Set<string>, comments: string[]) {
  if (typeof hue !== "string" || PY_HUES.includes(hue)) return hue;
  const colormap = COLORMAPS[hue];
  if (!colormap) {
    comments.push(`# ${hue} isn't built in: pass any function from t in [0, 1] to a color`);
    return new Raw("scheme");
  }
  imports.add("matplotlib");
  comments.push(`# matplotlib's ${colormap} colormap can differ slightly from d3's`);
  return new Raw(`matplotlib.colormaps[${JSON.stringify(colormap)}]`);
}

function pyCode(fn: string, args: unknown[]) {
  const imports = new Set<string>();
  const comments: string[] = [];
  // The options object becomes keyword arguments. Values are indented for a call broken over lines,
  // which it is whenever a value is.
  const last = args.at(-1);
  const options = last && Object.getPrototypeOf(last) === Object.prototype ? (last as Record<string, unknown>) : null;
  const keywords = Object.entries(options ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${snake(k)}=${pyFormat(k === "hue" ? pyHue(v, imports, comments) : v, "    ", imports)}`);
  const positional = (options ? args.slice(0, -1) : args).map((a) => pyFormat(a, "    ", imports));
  const call = wrap(`c3.${snake(fn)}(`, [...positional, ...keywords], ")", "");
  // hierarchy() returns a callable, with the modules as dicts in depth-first order
  const lines = fn === "hierarchy" ? [`color = ${call}`, 'colors = [m["color"] for m in color.modules]'] : [call];
  const head = `${imports.has("math") ? "import math\n\n" : ""}import c3\n${imports.has("matplotlib") ? "import matplotlib\n" : ""}`;
  return `${head}\n${[...comments, ...lines].join("\n")}`;
}

/** Source code for a library call in JS and Python, leaving out an empty options object */
export function callCode(fn: string, ...args: unknown[]): ByLang {
  return { js: jsCode(fn, args), py: pyCode(fn, args) };
}
