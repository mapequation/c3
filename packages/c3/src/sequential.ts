import { gamutMap, labToHex, labToLch, lchToHex, parseOklab, parseOklch, type Lab } from "./oklab.js";
import { palette, type HueSource } from "./palette.js";
import { getScheme, type Scheme, type SchemeName } from "./schemes.js";
import type { Range, ToneOption } from "./tone.js";

/** How a sequential scale goes from one seed to the next */
export type SequentialPath = "relative" | "straight";

export type SequentialOptions = {
  /**
   * Colors the scale goes through, any CSS colors with different lightness, sorted by lightness.
   * Without seeds, the scale follows the scheme given as hue, or goes through the first color of
   * palette() with the same tone and offset.
   */
  seeds?: readonly string[];
  /** Lightness and chroma of the color the scale goes through without seeds or a scheme, as in palette() */
  tone?: ToneOption;
  /**
   * Without seeds, a d3 color scheme name or interpolator for a scale that follows the scheme, like
   * "Viridis" or "Blues", or "Oklch" (default) for a scale through the first color of palette(). The
   * scheme's lightness must go one way, from light to dark or dark to light, so not "Turbo",
   * "Rainbow", "Sinebow" or a diverging scheme.
   */
  hue?: HueSource;
  /** Where on the OKLCH hue circle the color sits without seeds or a scheme, as in palette(). Default 245 (blue) */
  offset?: number;
  /**
   * OKLCH lightness of the dark and light ends, [min, max], where 0 is black and 1 is white.
   * Widened to include every seed. With a scheme, the scheme's own by default, and the scheme is
   * stretched to fit one you give.
   */
  lightness?: Range;
  /**
   * Chroma at the light end, as a fraction of the lightest seed's, both relative to the most
   * colorful color sRGB has at that lightness and hue. At 1 the end is as colorful as the
   * seed for its lightness, which fades toward white. With a scheme, a fraction of the scheme's
   * own chroma, changing evenly from darkChroma at the dark end.
   */
  lightChroma?: number;
  /** Chroma at the dark end, as a fraction of the darkest seed's, like lightChroma */
  darkChroma?: number;
  /**
   * Degrees the hue turns from the lightest seed to the light end. With a scheme, degrees the
   * scheme's hue turns at the light end, changing evenly from darkHue at the dark end.
   */
  lightHue?: number;
  /** Degrees the hue turns from the darkest seed to the dark end, like lightHue */
  darkHue?: number;
  /** Go from dark (t = 0) to light (t = 1) instead of from light to dark */
  reverse?: boolean;
  /**
   * How the scale goes from one seed to the next. "relative" (default) goes in a straight line across the
   * hue circle with each seed at its share of the most chroma sRGB has: seeds of similar hue keep their
   * share, so the scale is as colorful as they are where sRGB allows it, and seeds of very different hue,
   * like blue and orange, meet in a greyish color. "straight" goes in a straight line through OKLab, so no
   * color between two seeds is more colorful than they are, and next to a near-white seed the colors are
   * pale. The ends follow the outermost seeds either way. Not used with a scheme.
   */
  path?: SequentialPath;
};

/** A sequential scale: call it with t in [0, 1] for a color, light to dark */
export type Sequential = {
  (t: number): string;
  /**
   * n colors in the order of t, evenly spaced in lightness between the seeds and
   * toward the ends. Every seed is among them, so n must be at least the number of seeds.
   * The ends are included unless the nearest seed is within half a step of them.
   * With a scheme, n colors evenly spaced from end to end, or the middle for one.
   */
  colors(n: number): string[];
};

export const defaultSequentialOptions = {
  lightness: [0.3, 0.95] as Range,
  lightChroma: 1,
  darkChroma: 1,
  lightHue: 0,
  darkHue: 0,
  reverse: false,
  path: "relative" as SequentialPath,
};

// Below this chroma an anchor's hue barely shows, so it takes the hue of a colorful anchor
const ACHROMATIC = 0.01;

// More than any sRGB color's OKLCH chroma, for finding the most a lightness and hue can have
const MAX_CHROMA = 0.5;

// Relative tolerance for comparing step sizes, so near-ties break the same in every language
const TIE = 1e-9;

// Places a scheme is read at, one per color of d3's 256-color schemes
const SCHEME_STEPS = 256;

// How far a scheme's lightness may turn back, from rounding to 8-bit colors, and still count as one way
const SCHEME_WOBBLE = 0.02;

// S is chroma relative to the most colorful color sRGB has at the knot's lightness and hue
type Knot = { L: number; S: number; H: number; anchor?: Lab };

/**
 * A sequential scale through one or more seed colors, extended to darker and lighter shades.
 * The seeds, called anchors below, are sorted by lightness. Lightness changes linearly with t,
 * from the light end to the dark end. Chroma is relative to the most colorful color sRGB has at each
 * lightness and hue, so the scale stays as colorful as the anchors where sRGB allows it, and fades
 * toward black and white. Between anchors the scale goes in a straight line across the hue circle
 * in those terms, or through OKLab with the straight path; toward the ends hue and chroma follow
 * smooth curves from the outermost anchors.
 *
 * Without seeds, a d3 scheme given as hue is followed instead: by default the scale has the scheme's
 * colors, from light to dark, evenly spaced in lightness. The lightness range stretches the scheme,
 * keeping each color's hue and chroma relative to the sRGB limit, and the chroma and hue at the
 * ends scale chroma and turn hue, changing evenly from one end to the other.
 * @param options Seed colors, a scheme to follow or the tone, hue and offset of one color,
 * lightness range, chroma and hue at the ends, and direction
 * @returns a function from t in [0, 1] to a hex color, with colors(n) for n steps
 */
export function sequential(options: SequentialOptions = {}): Sequential {
  const {
    seeds = [],
    tone,
    hue,
    offset,
    lightness = defaultSequentialOptions.lightness,
    lightChroma = defaultSequentialOptions.lightChroma,
    darkChroma = defaultSequentialOptions.darkChroma,
    lightHue = defaultSequentialOptions.lightHue,
    darkHue = defaultSequentialOptions.darkHue,
    reverse = defaultSequentialOptions.reverse,
    path = defaultSequentialOptions.path,
  } = options;
  const [lo, hi] = lightness;
  if (!(lo >= 0 && hi <= 1 && lo < hi)) {
    throw new RangeError(`lightness must be [min, max] with 0 <= min < max <= 1, got [${lo}, ${hi}]`);
  }
  for (const [name, value] of Object.entries({ lightChroma, darkChroma })) {
    if (!(value >= 0 && Number.isFinite(value))) {
      throw new RangeError(`${name} must be finite and at least 0, got ${value}`);
    }
  }
  for (const [name, value] of Object.entries({ lightHue, darkHue })) {
    if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite, got ${value}`);
  }
  if (path !== "relative" && path !== "straight") {
    throw new RangeError(`Unknown path: ${path}, use "relative" or "straight"`);
  }

  if (typeof seeds === "string") throw new TypeError("seeds takes an array of colors, not a single color");
  if (seeds.length === 0 && hue !== undefined && hue !== "Oklch") {
    return schemeScale(schemePoints(hue), options.lightness, { lightChroma, darkChroma, lightHue, darkHue }, reverse);
  }
  // Without seeds, the first color palette() would give
  const knots = anchorKnots(seeds.length > 0 ? seeds : palette(1, { tone, hue, offset }));
  const darkest = knots[0]!;
  const lightest = knots[knots.length - 1]!;
  const Lmin = Math.min(lo, darkest.L);
  const Lmax = Math.max(hi, lightest.L);
  // Gaps from the outermost anchors to the ends; an anchor at or beyond an end is the end
  const darkGap = darkest.L - Lmin;
  const lightGap = Lmax - lightest.L;
  if (darkGap > 0) knots.unshift({ L: Lmin, S: darkChroma * darkest.S, H: darkest.H + darkHue });
  if (lightGap > 0) knots.push({ L: Lmax, S: lightChroma * lightest.S, H: lightest.H + lightHue });

  const anchors = knots.filter((k) => k.anchor);
  // With one anchor, smooth curves from end to end through it; with more, each end follows only its
  // outermost anchor
  const curved = polar(knots);
  const dark = anchors.length > 1 && darkGap > 0 ? polar(knots.slice(0, 2)) : curved;
  const light = anchors.length > 1 && lightGap > 0 ? polar(knots.slice(-2)) : curved;
  const between = path === "straight" ? straightBetween : relativeBetween;

  const colorAt = (L: number) => {
    const knot = knots.find((k) => k.L === L);
    if (knot?.anchor) return labToHex(knot.anchor);
    if (L < darkest.L) return dark(L);
    if (L > lightest.L) return light(L);
    return between(anchors, L);
  };

  const scale = (t: number) => {
    if (Number.isNaN(t)) throw new RangeError("t must be a number in [0, 1], got NaN");
    const u = Math.min(1, Math.max(0, t));
    return colorAt(reverse ? Lmin + (Lmax - Lmin) * u : Lmax - (Lmax - Lmin) * u);
  };

  scale.colors = (n: number) => {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`n must be a whole number of at least 0, got ${n}`);
    if (n === 0) return [];
    if (n < anchors.length) {
      throw new RangeError(`colors(n) includes every seed, so n must be at least ${anchors.length}, got ${n}`);
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

/** A color's lightness, and its share of the most chroma sRGB has as a point on the hue circle */
type SharePoint = { L: number; x: number; y: number };

/**
 * A scheme's colors from dark to light as share points, read at evenly spaced places,
 * with lightness that never goes down
 * @throws if the scheme's lightness goes up and down, or doesn't change
 */
function schemePoints(hue: Scheme | SchemeName): SharePoint[] {
  const scheme = typeof hue === "string" ? getScheme(hue) : hue;
  if (!scheme) throw new Error(`Unknown color scheme: ${hue}`);
  const points = Array.from({ length: SCHEME_STEPS }, (_, i) => {
    const [L, C, H] = parseOklch(scheme(i / (SCHEME_STEPS - 1)));
    const max = maxChroma(L, H);
    const S = max > 0 ? Math.min(1, C / max) : 0;
    const h = (H * Math.PI) / 180;
    return { L, x: S * Math.cos(h), y: S * Math.sin(h) };
  });
  if (points[0]!.L > points[points.length - 1]!.L) points.reverse();

  const name = typeof hue === "string" ? hue : "The scheme";
  let top = points[0]!.L;
  for (const point of points) {
    if (point.L < top - SCHEME_WOBBLE) throw new RangeError(`${name} isn't sequential: its lightness goes up and down`);
    top = Math.max(top, point.L);
    point.L = top;
  }
  if (!(top > points[0]!.L)) throw new RangeError(`${name} isn't sequential: its lightness doesn't change`);
  return points;
}

/**
 * The lightness range a scale that follows the scheme has by default, [darkest, lightest]
 * @throws if the scheme isn't sequential
 */
export function schemeLightness(hue: Scheme | SchemeName): Range {
  const points = schemePoints(hue);
  return [points[0]!.L, points[points.length - 1]!.L];
}

/**
 * A scale that follows a scheme by lightness, stretched to the lightness range, with each color's
 * share of the most chroma sRGB has scaled and its hue turned, evenly from the dark end to the light end
 */
function schemeScale(
  points: SharePoint[],
  lightness: Range | undefined,
  ends: { lightChroma: number; darkChroma: number; lightHue: number; darkHue: number },
  reverse: boolean,
): Sequential {
  const { lightChroma, darkChroma, lightHue, darkHue } = ends;
  const darkest = points[0]!.L;
  const lightest = points[points.length - 1]!.L;
  const [lo, hi] = lightness ?? [darkest, lightest];

  const colorAt = (L: number) => {
    // From the dark end (0) to the light end (1), and the scheme's own lightness there
    const u = (L - lo) / (hi - lo);
    const source = darkest + u * (lightest - darkest);
    let k = 1;
    while (k < points.length - 1 && points[k]!.L < source) ++k;
    const p = points[k - 1]!;
    const q = points[k]!;
    const s = q.L > p.L ? Math.min(1, Math.max(0, (source - p.L) / (q.L - p.L))) : 0;
    const x = p.x + s * (q.x - p.x);
    const y = p.y + s * (q.y - p.y);
    const H = (Math.atan2(y, x) * 180) / Math.PI + darkHue + u * (lightHue - darkHue);
    const share = (darkChroma + u * (lightChroma - darkChroma)) * Math.hypot(x, y);
    return lchToHex([L, share * maxChroma(L, H), H]);
  };

  const scale = (t: number) => {
    if (Number.isNaN(t)) throw new RangeError("t must be a number in [0, 1], got NaN");
    const u = Math.min(1, Math.max(0, t));
    return colorAt(reverse ? lo + (hi - lo) * u : hi - (hi - lo) * u);
  };

  // From end to end, or the middle for a single color
  scale.colors = (n: number) => {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`n must be a whole number of at least 0, got ${n}`);
    if (n === 1) return [scale(0.5)];
    return Array.from({ length: n }, (_, i) => scale(i / (n - 1)));
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

  return knots;
}

/**
 * Colors through the knots by lightness, with hue and chroma relative to the most sRGB has
 * on smooth curves through them
 */
function polar(knots: Knot[]) {
  const Ls = knots.map((k) => k.L);
  const relative = pchip(Ls, knots.map((k) => k.S));
  const hueAt = pchip(Ls, knots.map((k) => k.H));
  return (L: number) => {
    const H = hueAt(L);
    return lchToHex([L, relative(L) * maxChroma(L, H), H]);
  };
}

/** The anchors on either side of lightness L, and how far L is from the first to the second */
function segment(anchors: Knot[], L: number): [Knot, Knot, number] {
  let k = 0;
  while (k < anchors.length - 2 && L > anchors[k + 1]!.L) ++k;
  const a = anchors[k]!;
  const b = anchors[k + 1]!;
  return [a, b, (L - a.L) / (b.L - a.L)];
}

/** The color at lightness L on the straight line in OKLab between the anchors on either side of it */
function straightBetween(anchors: Knot[], L: number) {
  const [a, b, s] = segment(anchors, L);
  const [, a0, b0] = a.anchor!;
  const [, a1, b1] = b.anchor!;
  return lchToHex(labToLch([L, a0 + s * (a1 - a0), b0 + s * (b1 - b0)]));
}

/**
 * The color at lightness L on the straight line between the anchors on either side of it, on a hue
 * circle where each anchor sits at its own hue and its share of the most chroma sRGB has
 */
function relativeBetween(anchors: Knot[], L: number) {
  const [a, b, s] = segment(anchors, L);
  const [x0, y0] = sharePoint(a);
  const [x1, y1] = sharePoint(b);
  const x = x0 + s * (x1 - x0);
  const y = y0 + s * (y1 - y0);
  const H = (Math.atan2(y, x) * 180) / Math.PI;
  return lchToHex([L, Math.hypot(x, y) * maxChroma(L, H), H]);
}

/** An anchor at its share of the most chroma sRGB has, at its own hue rather than one it took from another */
function sharePoint(knot: Knot): [number, number] {
  const h = (labToLch(knot.anchor!)[2] * Math.PI) / 180;
  return [knot.S * Math.cos(h), knot.S * Math.sin(h)];
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
