import Node from "./Node";
import * as schemes from "d3-scale-chromatic";
import { hsl, HSLColor } from "d3-color";

// Scheme names from d3-scale-chromatic
// https://raw.githubusercontent.com/d3/d3-scale-chromatic/main/src/index.js
const SCHEME_NAMES = [
  // diverging
  "BrBG",
  "PRGn",
  "PiYG",
  "PuOr",
  "RdBu",
  "RdGy",
  "RdYlBu",
  "RdYlGn",
  "Spectral",
  // sequential-single
  "Greens",
  "Greys",
  "Purples",
  "Reds",
  "Oranges",
  "Greens",
  "Greys",
  "Purples",
  "Reds",
  "Oranges",
  // sequential-multi
  "BuGn",
  "BuPu",
  "GnBu",
  "OrRd",
  "PuBuGn",
  "PuBu",
  "PuRd",
  "RdPu",
  "YlGnBu",
  "YlGn",
  "YlOrBr",
  "YlOrRd",
  "Blues",
  "Cividis",
  "CubehelixDefault",
  "Turbo",
  "Viridis",
  // sequential-cyclic
  "Rainbow",
  "Sinebow",
] as const;

export type Scheme = typeof schemes.interpolateRainbow;
export type SchemeName = typeof SCHEME_NAMES[number];

export type Interval = {
  start: number;
  end: number;
};

export type Options = Partial<Interval> & {
  scheme?: Scheme | SchemeName;
  saturation?: number;
  lightness?: number;
  saturationEnd?: number;
  lightnessEnd?: number;
  offset?: number;
  reverse?: boolean;
  strength?: number;
  midpoint?: number;
  steepness?: number;
};

function clampToDecimal(t: number, offset: number = 0) {
  const _t = t + offset;
  return _t - Math.floor(_t);
}

/**
 * Generate categorical colors
 * @param n Number of colors or an array of weights
 * @param options Optional parameter to specify interval, color scheme etc
 * @returns
 */
export function colors(
  n: number | number[] | Interval[] = 16,
  {
    scheme = schemes.interpolateRainbow,
    saturation = undefined,
    lightness = undefined,
    saturationEnd = undefined,
    lightnessEnd = undefined,
    start = 0,
    end = 1,
    offset = 0,
    reverse = false,
    strength,
    midpoint = 4,
    steepness = 1,
  }: Options = {},
) {
  const _scheme = typeof scheme === "string" ? getScheme(scheme) : scheme;

  const _stops = isIntervalArray(n) ? n : stops(n, { start, end, strength });

  const colors = _stops.map(({ start }) => {
    const value = clampToDecimal(start, offset);
    return _scheme(reverse ? 1 - value : value);
  });

  if (saturation === undefined && lightness === undefined) {
    return colors;
  }

  return colors.map((c, i) => {
    const node = _stops[i] as Node;
    const _hsl = hsl(c);
    _hsl.s = getSigmoidInterpolatedValue(
      saturation ?? 0.8,
      saturationEnd ?? saturation ?? 1.0,
      node,
      midpoint,
      steepness,
    );
    _hsl.l = getSigmoidInterpolatedValue(
      lightness ?? 0.6,
      lightnessEnd ?? lightness ?? 0.4,
      node,
      midpoint,
      steepness,
    );
    return _hsl.toString();
  });
}

export type StopsOptions = Partial<Interval> & {
  strength?: number;
};

/**
 * Generate n color stops on the specified interval (default [0, 1]).
 * If weights are provided, the strength parameter is default 1.
 * If not, strength is default 0, but uses exponential weights if increased.
 * This keeps the consistency of earlier colors when increasing the numbers.
 *
 * @param n number of color stops or an array of weights
 * @param options set custom interval and weight strength
 * @returns array of color stops
 */
export function stops(
  n: number | number[] = 10,
  { start = 0, end = 1, strength }: StopsOptions = {},
): Interval[] {
  const isWeighted = typeof n !== "number";
  const weights: number[] = isWeighted ? n : getDefaultWeights(n);
  if (strength === undefined) {
    strength = isWeighted ? 1 : 0;
  }
  const numColors = weights.length;
  if (numColors === 0) return [];

  const numLoops = Math.ceil(Math.log2(numColors));
  const intervals = [new Node(start, end, weights[0], weights[0])];

  let currentNodeIndex = 0;
  for (let i = 0; i < numLoops; ++i) {
    const length = intervals.length;
    for (let j = 0; j < length; ++j) {
      const next = intervals[j]!.split(weights[++currentNodeIndex], strength);
      next.subLevel = j;
      intervals.push(next);
      if (intervals.length === numColors) {
        return intervals;
      }
    }
  }

  return intervals;
}

export function getDefaultWeights(n: number, skewness: number = 1) {
  return Array.from({ length: n }, (_, i) =>
    Math.exp(skewness * 0.25 * (n - i)),
  );
}

/**
 * Get interpolator function from d3 scheme name
 * @param scheme d3 scheme name
 * @returns d3 interpolator
 */
function getScheme(scheme: SchemeName): Scheme {
  const schemeName = `interpolate${scheme}`;
  // @ts-ignore
  return schemes[schemeName] as any as Scheme;
}

function isIntervalArray(n: any): n is Interval[] {
  return (
    Array.isArray(n) &&
    n.length > 0 &&
    typeof n[0] === "object" &&
    "start" in n[0] &&
    "end" in n[0]
  );
}

export function convexCombination(a: number, b: number, t: number) {
  return (1 - t) * a + t * b;
}

export function sigmoid(
  x: number,
  midpoint: number = 4,
  steepness: number = 1,
) {
  return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
}

export function cantorDepth(node: { startLevel: number; subLevel: number }) {
  return (
    node.startLevel + node.subLevel / 2 ** Math.max(0, node.startLevel - 1)
  );
}

export function getSigmoidInterpolatedValue(
  a: number,
  b: number,
  node: { startLevel: number; subLevel: number },
  midpoint: number = 4,
  steepness: number = 1,
) {
  const t = sigmoid(cantorDepth(node), midpoint, steepness);
  return convexCombination(a, b, t);
}
