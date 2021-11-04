import Node from "./Node";
import * as schemes from "d3-scale-chromatic";
import { hsl } from "d3-color";

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

type Options = {
  scheme?: Scheme | SchemeName;
  saturation?: number;
  lightness?: number;
};

/**
 * Generate categorical colors
 * @param n Number of colors or an array of weights
 * @param interval Generate color stops in the specified interval, default [0,1]
 * @param options Optional parameter to specify color scheme, saturation and lightness
 * @returns
 */
export function colors(
  n: number | number[] = 16,
  interval: Interval = { start: 0, end: 1 },
  {
    scheme = schemes.interpolateRainbow,
    saturation = undefined,
    lightness = undefined,
  }: Options = {},
) {
  const _scheme = typeof scheme === "string" ? getScheme(scheme) : scheme;

  const _stops =
    typeof n === "number" ? stops(n, interval) : weightedStops(n, interval);

  const colors = _stops.map(({ start }) => _scheme(start));

  if (saturation !== undefined || lightness !== undefined) {
    colors.forEach((c) => {
      const _hsl = hsl(c);
      _hsl.s = saturation ?? 1.0;
      _hsl.l = lightness ?? 0.5;
      return _hsl?.rgb().toString() ?? "red";
    });
  }

  return colors;
}

/**
 * Generate weighted intervals on the interval [0, 1]
 * @param weights array of weights
 * @param interval interval to generate
 * @returns array of intervals
 */
export function weightedStops(
  weights: number[] | number,
  interval: Interval = { start: 0, end: 1 },
): Interval[] {
  if (typeof weights === "number") {
    if (weights === 0) return [];
    weights = new Array(weights).fill(1 / weights);
  }

  if (weights.length === 0) {
    return [];
  }

  const total = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(total - 1) > 1e-6) {
    weights = weights.map((w) => w / total);
  }

  let { start, end } = interval;
  const delta = end - start;

  const intervals = weights.map((weight) => {
    const step = weight * delta;
    const interval: Interval = { start, end: start + step };
    start += step;
    return interval;
  });

  const result: Interval[] = [];

  for (let i = 0; i < weights.length; i += 2) {
    result.push(intervals[i]);
    if (i > 0) {
      result.push(intervals[i - 1]);
    }
    if (i + 2 == weights.length) {
      result.push(intervals[i + 1]);
      break;
    }
  }

  return result;
}

/**
 * Generate n color stops on the interval [0, 1].
 * @param n number of color stops
 * @param interval interval to generate
 * @returns array of color stops
 */
export function stops(
  n: number | number[] = 10,
  interval: Interval = { start: 0, end: 1 },
): Interval[] {
  if (typeof n !== "number") {
    n = n.length;
  }
  if (n === 0) return [];

  const numLoops = Math.ceil(Math.log2(n));
  const intervals = [new Node(interval.start, interval.end)];

  for (let i = 0; i < numLoops; ++i) {
    const length = intervals.length;
    for (let j = 0; j < length; ++j) {
      const [first, second] = intervals[j]!.split();
      intervals[j] = first;
      intervals.push(second);
      if (intervals.length === n) {
        return intervals;
      }
    }
  }

  return intervals;
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
