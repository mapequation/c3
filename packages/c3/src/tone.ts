import { gamutMap, lchToLab, parseOklch, type Lab } from "./oklab.js";

export type Range = [min: number, max: number];

/**
 * A tone: the region of OKLCH color space to pick colors from.
 */
export type Tone = {
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

/**
 * Named tones, loosely after the PCCS tone system, but with narrower lightness ranges
 * so that no hue stands out. The sRGB gamut caps chroma below the range for some hues,
 * most for cyan and yellow in the colorful tones.
 */
export const tones = {
  /** The most colorful, close to the sRGB limit for many hues */
  vivid: { lightness: [0.55, 0.7], chroma: [0.15, 0.21], warmHue: 285, tilt: 0 },
  /** Colorful and lighter than vivid, close to d3gl's module colors */
  bright: { lightness: [0.64, 0.76], chroma: [0.12, 0.17], warmHue: 285, tilt: 0 },
  /** Between vivid and deep, with wider ranges that fit the most distinct colors. The default */
  strong: { lightness: [0.55, 0.76], chroma: [0.08, 0.17], warmHue: 285, tilt: 0 },
  /** Dark and colorful, for light backgrounds */
  deep: { lightness: [0.45, 0.62], chroma: [0.1, 0.17], warmHue: 285, tilt: 0 },
  /** Darker and less colorful than deep */
  dark: { lightness: [0.36, 0.5], chroma: [0.06, 0.12], warmHue: 285, tilt: 0 },
  /** Lighter and less colorful, close to the Englewood mural */
  soft: { lightness: [0.67, 0.83], chroma: [0.045, 0.135], warmHue: 285, tilt: 0.15 },
  /** Light, for large areas or dark backgrounds */
  pastel: { lightness: [0.82, 0.92], chroma: [0.05, 0.1], warmHue: 285, tilt: 0 },
  /** Greyish, so highlights stand out */
  muted: { lightness: [0.55, 0.75], chroma: [0.03, 0.08], warmHue: 285, tilt: 0 },
} satisfies Record<string, Tone>;

export type ToneName = keyof typeof tones;

/** A tone name, colors to infer the tone from, or tone fields over the base tone */
export type ToneOption = ToneName | readonly string[] | Partial<Tone>;

export const defaultTone: Tone = tones.strong;

const isColors = (tone: ToneOption): tone is readonly string[] => Array.isArray(tone);

/**
 * The tone a tone option gives: a named tone, the tone inferred from colors,
 * or the given fields over the base tone.
 */
export function resolveTone(tone: ToneOption | undefined, base: Tone = defaultTone): Tone {
  if (tone === undefined) return base;
  if (typeof tone === "string") {
    if (!Object.prototype.hasOwnProperty.call(tones, tone)) throw new Error(`Unknown tone: ${tone}`);
    return tones[tone];
  }
  if (isColors(tone)) return inferTone(tone);
  return {
    lightness: tone.lightness ?? base.lightness,
    chroma: tone.chroma ?? base.chroma,
    warmHue: tone.warmHue ?? base.warmHue,
    tilt: tone.tilt ?? base.tilt,
  };
}

const lerp = ([a, b]: Range, t: number) => a + (b - a) * t;

/**
 * Map hue (degrees) and u, v in [0, 1] to a color in the tone.
 * u sets lightness, v sets chroma within the hue's chroma range.
 */
export function toneColor(tone: Tone, hue: number, u: number, v: number): Lab {
  const { lightness, chroma, warmHue, tilt } = tone;
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
 * Infer a tone from example colors: the lightness and chroma ranges they span,
 * and whether some hues are more saturated than others.
 */
export function inferTone(colors: readonly string[]): Tone {
  if (colors.length === 0) return defaultTone;
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
 * Interpolate between two tones, t = 0 gives a and t = 1 gives b.
 */
export function mixTone(a: Tone, b: Tone, t: number): Tone {
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
 * How far color i (0-based) has moved from the top tone to the end tone.
 * The first `midpoint` colors stay in the top tone. Later colors move
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
