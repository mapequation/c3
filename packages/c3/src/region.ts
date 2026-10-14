import { gamutMap, lchToLab, parseOklch, type Lab } from "./oklab.js";

export type Range = [min: number, max: number];

/**
 * A region of OKLCH color space to pick colors from.
 */
export type Region = {
  /** OKLCH lightness range, 0 (black) to 1 (white) */
  lightness: Range;
  /** OKLCH chroma range, 0 (grey) to about 0.37 */
  chroma: Range;
  /** Hue in degrees where chroma can reach the top of its range */
  warmHue: number;
  /**
   * How much the chroma range shrinks away from warmHue.
   * 0 gives the same range for all hues; 1 gives greys opposite warmHue.
   */
  tilt: number;
};

export const defaultRegion: Region = {
  lightness: [0.67, 0.83],
  chroma: [0.045, 0.135],
  warmHue: 285,
  tilt: 0.15,
};

export function resolveRegion(options: Partial<Region> = {}, base = defaultRegion): Region {
  return {
    lightness: options.lightness ?? base.lightness,
    chroma: options.chroma ?? base.chroma,
    warmHue: options.warmHue ?? base.warmHue,
    tilt: options.tilt ?? base.tilt,
  };
}

const lerp = ([a, b]: Range, t: number) => a + (b - a) * t;

/**
 * Map hue (degrees) and u, v in [0, 1] to a color in the region.
 * u sets lightness, v sets chroma within the hue's chroma range.
 */
export function regionColor(region: Region, hue: number, u: number, v: number): Lab {
  const { lightness, chroma, warmHue, tilt } = region;
  const warmth = (1 + Math.cos(((hue - warmHue) * Math.PI) / 180)) / 2;
  const scale = 1 - tilt + tilt * warmth;
  const L = lerp(lightness, u);
  const C = chroma[0] + (chroma[1] - chroma[0]) * v * scale;
  return lchToLab(gamutMap([L, C, hue]));
}

const MIN_LIGHTNESS_SPAN = 0.1;
const MIN_CHROMA_SPAN = 0.04;

function widen([min, max]: Range, minSpan: number, upper: number): Range {
  const pad = Math.max(0, minSpan - (max - min)) / 2;
  const lo = Math.max(0, min - pad);
  const hi = Math.min(upper, max + pad);
  return [lo, hi];
}

/**
 * Infer a region from example colors: the lightness and chroma ranges they span,
 * and whether some hues are more saturated than others.
 */
export function inferRegion(colors: readonly string[]): Region {
  if (colors.length === 0) return defaultRegion;
  const lch = colors.map(parseOklch);
  const Ls = lch.map((c) => c[0]);
  const Cs = lch.map((c) => c[1]);
  const lightness = widen([Math.min(...Ls), Math.max(...Ls)], MIN_LIGHTNESS_SPAN, 1);
  const chroma = widen([Math.min(...Cs), Math.max(...Cs)], MIN_CHROMA_SPAN, 0.37);

  // Least squares fit of C = a + b cos(H) + c sin(H).
  // The phase gives the most saturated hue, the amplitude the tilt.
  const { warmHue, amplitude } = fitChromaByHue(lch);
  // With chroma uniform under the cap, the cos amplitude is span * tilt / 4.
  // Use half of it: a few seeds overstate the tilt, and a full tilt
  // greys out the opposite hues so they become hard to tell apart.
  const span = chroma[1] - chroma[0];
  const tilt = lch.length < 3 ? 0 : Math.min(1, (4 * amplitude) / span) / 2;

  return { lightness, chroma, warmHue, tilt };
}

function fitChromaByHue(lch: [number, number, number][]) {
  const S = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const y = [0, 0, 0];
  for (const [, C, H] of lch) {
    const h = (H * Math.PI) / 180;
    const row = [1, Math.cos(h), Math.sin(h)];
    for (let i = 0; i < 3; ++i) {
      y[i] += row[i] * C;
      for (let j = 0; j < 3; ++j) S[i][j] += row[i] * row[j];
    }
  }
  const det = determinant(S);
  if (Math.abs(det) < 1e-12) return { warmHue: 0, amplitude: 0 };
  // Cramer's rule
  const [, b, c] = [0, 1, 2].map(
    (k) => determinant(S.map((row, i) => row.map((v, j) => (j === k ? y[i] : v)))) / det,
  ) as [number, number, number];
  const H = (Math.atan2(c, b) * 180) / Math.PI;
  return { warmHue: H < 0 ? H + 360 : H, amplitude: Math.hypot(b, c) };
}

function determinant(m: number[][]) {
  const [a, b, c] = m as [number[], number[], number[]];
  return (
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    a[1] * (b[0] * c[2] - b[2] * c[0]) +
    a[2] * (b[0] * c[1] - b[1] * c[0])
  );
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function mixAngle(a: number, b: number, t: number) {
  const d = ((((b - a) % 360) + 540) % 360) - 180; // shortest way around
  return (a + d * t + 360) % 360;
}

/**
 * Interpolate between two regions, t = 0 gives a and t = 1 gives b.
 */
export function mixRegion(a: Region, b: Region, t: number): Region {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    lightness: [mix(a.lightness[0], b.lightness[0], t), mix(a.lightness[1], b.lightness[1], t)],
    chroma: [mix(a.chroma[0], b.chroma[0], t), mix(a.chroma[1], b.chroma[1], t)],
    warmHue: mixAngle(a.warmHue, b.warmHue, t),
    tilt: mix(a.tilt, b.tilt, t),
  };
}

/**
 * How far color i (0-based) has moved from the top region to the end region.
 * The first `midpoint` colors stay in the top region. Later colors move
 * 1 - (m / k)^steepness of the way, where k is the color number and m the
 * midpoint, so an infinite steepness switches at once.
 */
export function zoneWeight(i: number, midpoint: number, steepness: number) {
  const k = i + 1;
  const m = midpoint + 0.5;
  if (k < m) return 0;
  if (!Number.isFinite(steepness)) return 1;
  return 1 - (m / k) ** steepness;
}

const END_GAP = 0.03; // lightness between the top zone and the end zone
const END_SPAN = 0.22; // lightness span of the end zone
const DARKEST = 0.3; // below and above these, colors barely show their hue
const LIGHTEST = 0.95;

/**
 * Lightness range for later colors: just below ("darker") or just above ("lighter")
 * the given range, 0.03 apart from it and 0.22 wide, kept between 0.3 and 0.95.
 */
export function endLightness([L0, L1]: Range, direction: "darker" | "lighter" = "darker"): Range {
  if (direction === "darker") {
    const max = Math.max(DARKEST, L0 - END_GAP);
    return [Math.max(DARKEST, max - END_SPAN), max];
  }
  const min = Math.min(LIGHTEST, L1 + END_GAP);
  return [min, Math.min(LIGHTEST, min + END_SPAN)];
}
