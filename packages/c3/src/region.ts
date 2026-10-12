import { gamutMap, lchToLab, parseOklch, type Lab } from "./oklab.js";
import { vanDerCorput } from "./halton.js";

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

/**
 * The i:th point of a Halton sequence in the region.
 * Hue from base 2, lightness from base 3 and chroma from base 5.
 */
export function haltonColor(region: Region, i: number, hue = 0): Lab {
  const h = (hue + 360 * vanDerCorput(i, 2)) % 360;
  return regionColor(region, h, vanDerCorput(i, 3), vanDerCorput(i, 5));
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
