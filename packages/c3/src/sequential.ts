import { gamutMap, labToHex, labToLch, lchToHex, parseOklab, type Lab } from "./oklab.js";
import type { Range } from "./tone.js";

export type SequentialOptions = {
  /**
   * OKLCH lightness of the dark and light ends, [min, max], where 0 is black and 1 is white.
   * Widened to include every anchor.
   */
  lightness?: Range;
  /**
   * Chroma at the dark and light ends, as a fraction of the nearest anchor's, both relative to
   * the most colorful color sRGB has at that lightness and hue. At 1 the ends are as colorful
   * as the anchor for their lightness, which fades toward black and white.
   */
  endChroma?: [dark: number, light: number];
  /** Degrees the hue turns from the nearest anchor to the dark and light ends */
  endHue?: [dark: number, light: number];
  /** Go from dark (t = 0) to light (t = 1) instead of from light to dark */
  reverse?: boolean;
};

/** A sequential scale: call it with t in [0, 1] for a color, light to dark */
export type Sequential = {
  (t: number): string;
  /**
   * n colors in the order of t, evenly spaced in lightness between the anchors and
   * toward the ends. Every anchor is among them, so n must be at least the number of anchors.
   * The ends are included unless the nearest anchor is within half a step of them.
   */
  colors(n: number): string[];
};

export const defaultSequentialOptions = {
  lightness: [0.25, 0.97] as Range,
  endChroma: [1, 1] as [dark: number, light: number],
  endHue: [0, 0] as [dark: number, light: number],
  reverse: false,
};

// Below this chroma an anchor's hue barely shows, so it takes the hue of a colorful anchor
const ACHROMATIC = 0.01;

// More than any sRGB color's OKLCH chroma, for finding the most a lightness and hue can have
const MAX_CHROMA = 0.5;

// Relative tolerance for comparing step sizes, so near-ties break the same in every language
const TIE = 1e-9;

// S is chroma relative to the most colorful color sRGB has at the knot's lightness and hue
type Knot = { L: number; S: number; H: number; anchor?: Lab };

/**
 * A sequential scale through one or more anchor colors, extended to darker and lighter shades.
 * The anchors are sorted by lightness. Lightness changes linearly with t, from the light end
 * to the dark end, and hue and chroma follow smooth curves through the anchors. Chroma is
 * relative to the most colorful color sRGB has at each lightness and hue, so the scale stays
 * as colorful as the anchors where sRGB allows it, and fades toward black and white.
 * @param colors One or more anchor colors, any CSS colors, with different lightness
 * @param options Lightness range, chroma and hue at the ends, and direction
 * @returns a function from t in [0, 1] to a hex color, with colors(n) for n steps
 */
export function sequential(colors: string | readonly string[], options: SequentialOptions = {}): Sequential {
  const {
    lightness = defaultSequentialOptions.lightness,
    endChroma = defaultSequentialOptions.endChroma,
    endHue = defaultSequentialOptions.endHue,
    reverse = defaultSequentialOptions.reverse,
  } = options;
  const [lo, hi] = lightness;
  if (!(lo >= 0 && hi <= 1 && lo < hi)) {
    throw new RangeError(`lightness must be [min, max] with 0 <= min < max <= 1, got [${lo}, ${hi}]`);
  }
  if (!endChroma.every((c) => c >= 0 && Number.isFinite(c))) {
    throw new RangeError(`endChroma must be finite and at least 0, got [${endChroma.join(", ")}]`);
  }
  if (!endHue.every(Number.isFinite)) {
    throw new RangeError(`endHue must be finite, got [${endHue.join(", ")}]`);
  }

  const knots = anchorKnots(typeof colors === "string" ? [colors] : colors);
  const darkest = knots[0]!;
  const lightest = knots[knots.length - 1]!;
  const Lmin = Math.min(lo, darkest.L);
  const Lmax = Math.max(hi, lightest.L);
  // Gaps from the outermost anchors to the ends; an anchor at or beyond an end is the end
  const darkGap = darkest.L - Lmin;
  const lightGap = Lmax - lightest.L;
  if (darkGap > 0) knots.unshift({ L: Lmin, S: endChroma[0] * darkest.S, H: darkest.H + endHue[0] });
  if (lightGap > 0) knots.push({ L: Lmax, S: endChroma[1] * lightest.S, H: lightest.H + endHue[1] });

  const Ls = knots.map((k) => k.L);
  const relative = pchip(Ls, knots.map((k) => k.S));
  const hue = pchip(Ls, knots.map((k) => k.H));
  const chroma = (L: number) => relative(L) * maxChroma(L, hue(L));

  const colorAt = (L: number) => {
    const knot = knots.find((k) => k.L === L);
    if (knot?.anchor) return labToHex(knot.anchor);
    return lchToHex([L, chroma(L), hue(L)]);
  };

  const scale = (t: number) => {
    if (Number.isNaN(t)) throw new RangeError("t must be a number in [0, 1], got NaN");
    const u = Math.min(1, Math.max(0, t));
    return colorAt(reverse ? Lmin + (Lmax - Lmin) * u : Lmax - (Lmax - Lmin) * u);
  };

  scale.colors = (n: number) => {
    const anchors = knots.filter((k) => k.anchor);
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`n must be a whole number of at least 0, got ${n}`);
    if (n === 0) return [];
    if (n < anchors.length) {
      throw new RangeError(`colors(n) includes every anchor, so n must be at least ${anchors.length}, got ${n}`);
    }
    const hex = steps(
      anchors.map((k) => k.L),
      darkGap,
      lightGap,
      n,
    ).map(colorAt);
    return reverse ? hex : hex.reverse();
  };

  return scale;
}

/** The anchors sorted by lightness, with greys taking the hue of the nearest colorful anchor below or above */
function anchorKnots(colors: readonly string[]): Knot[] {
  if (colors.length === 0) throw new RangeError("sequential() needs at least one color");
  const knots: (Knot & { C: number })[] = colors
    .map((color) => {
      const anchor = parseOklab(color);
      const [L, C, H] = labToLch(anchor);
      const max = maxChroma(L, H);
      return { L, C, S: max > 0 ? Math.min(1, C / max) : 0, H, anchor };
    })
    .sort((a, b) => a.L - b.L);
  for (let i = 1; i < knots.length; ++i) {
    if (knots[i]!.L === knots[i - 1]!.L) {
      throw new RangeError("The colors of a sequential scale need different lightness");
    }
  }

  const colorful = knots.filter((k) => k.C >= ACHROMATIC);
  let previous = colorful.length > 0 ? colorful[0]!.H : 0;
  for (const knot of knots) {
    if (knot.C >= ACHROMATIC) previous = knot.H;
    else knot.H = previous;
  }

  // Unwrap hues so that consecutive anchors take the shortest way around the hue circle
  for (let i = 1; i < knots.length; ++i) {
    const a = knots[i - 1]!.H;
    const d = ((((knots[i]!.H - a) % 360) + 540) % 360) - 180;
    knots[i]!.H = a + d;
  }
  return knots;
}

/** The most chroma a color can have in sRGB at lightness L and hue H */
const maxChroma = (L: number, H: number) => gamutMap([L, MAX_CHROMA, H])[1];

/**
 * Lightness of n steps from dark to light that include every anchor. Each gap between
 * anchors is split evenly; the gaps to the ends hold steps only when they are larger
 * than half a step. The next step goes where the steps are farthest apart.
 */
function steps(anchors: number[], darkGap: number, lightGap: number, n: number) {
  type Gap = { from: number; size: number; count: number; outer: -1 | 0 | 1 };
  const gaps: Gap[] = [];
  if (darkGap > 0) gaps.push({ from: anchors[0]!, size: darkGap, count: 0, outer: -1 });
  for (let i = 1; i < anchors.length; ++i) {
    gaps.push({ from: anchors[i - 1]!, size: anchors[i]! - anchors[i - 1]!, count: 1, outer: 0 });
  }
  if (lightGap > 0) gaps.push({ from: anchors[anchors.length - 1]!, size: lightGap, count: 0, outer: 1 });

  // An empty gap to an end counts as twice its size, so it gets a step once that is more than half a step
  const spacing = (gap: Gap) => (gap.count === 0 ? 2 * gap.size : gap.size / gap.count);
  for (let remaining = n - anchors.length; remaining > 0; --remaining) {
    let best = gaps[0]!;
    for (const gap of gaps) if (spacing(gap) > spacing(best) * (1 + TIE)) best = gap;
    best.count += 1;
  }

  const Ls: number[] = [];
  for (const gap of gaps) {
    if (gap.outer === -1) {
      // From the dark end up to the darkest anchor
      for (let j = gap.count; j > 0; --j) Ls.push(gap.from - (gap.size * j) / gap.count);
    } else if (gap.outer === 0) {
      for (let j = 0; j < gap.count; ++j) Ls.push(gap.from + (gap.size * j) / gap.count);
    } else {
      Ls.push(gap.from);
      for (let j = 1; j <= gap.count; ++j) Ls.push(gap.from + (gap.size * j) / gap.count);
    }
  }
  if (gaps.every((gap) => gap.outer !== 1)) Ls.push(anchors[anchors.length - 1]!);
  return Ls;
}

/**
 * Monotone cubic interpolation through the points (xs, ys), with xs increasing,
 * after Fritsch and Carlson: no overshoot, and flat at every local extremum.
 */
function pchip(xs: number[], ys: number[]) {
  const m = xs.length;
  const h = xs.slice(1).map((x, k) => x - xs[k]!);
  const delta = h.map((hk, k) => (ys[k + 1]! - ys[k]!) / hk);
  const slopes = xs.map((_, k) => {
    if (m === 2) return delta[0]!;
    if (k === 0) return edgeSlope(h[0]!, h[1]!, delta[0]!, delta[1]!);
    if (k === m - 1) return edgeSlope(h[m - 2]!, h[m - 3]!, delta[m - 2]!, delta[m - 3]!);
    const d0 = delta[k - 1]!;
    const d1 = delta[k]!;
    if (d0 * d1 <= 0) return 0;
    const w1 = 2 * h[k]! + h[k - 1]!;
    const w2 = h[k]! + 2 * h[k - 1]!;
    return (w1 + w2) / (w1 / d0 + w2 / d1);
  });

  return (x: number) => {
    let k = 0;
    while (k < m - 2 && x > xs[k + 1]!) ++k;
    const s = (x - xs[k]!) / h[k]!;
    const r = 1 - s;
    return (
      (1 + 2 * s) * r * r * ys[k]! +
      s * r * r * h[k]! * slopes[k]! +
      s * s * (3 - 2 * s) * ys[k + 1]! -
      s * s * r * h[k]! * slopes[k + 1]!
    );
  };
}

/** The slope at an end: a three-point estimate, kept from overshooting */
function edgeSlope(h0: number, h1: number, d0: number, d1: number) {
  const d = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
  if (Math.sign(d) !== Math.sign(d0)) return 0;
  if (Math.sign(d0) !== Math.sign(d1) && Math.abs(d) > 3 * Math.abs(d0)) return 3 * d0;
  return d;
}
