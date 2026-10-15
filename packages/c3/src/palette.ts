import { getScheme, type Scheme, type SchemeName } from "./schemes.js";
import { stops } from "./stops.js";
import { vanDerCorput } from "./halton.js";
import { labDistance, labToHex, parseOklab, parseOklch, type Lab } from "./oklab.js";
import {
  defaultTone,
  endLightness,
  inferTone,
  mixTone,
  resolveTone,
  toneColor,
  zoneWeight,
  type Range,
  type Tone,
  type ToneOption,
} from "./tone.js";
import { farthest, lookahead } from "./select.js";

/**
 * How the next color is chosen from the palette's sequence of colors:
 * - "sequence": the next one, fast and works with weights
 * - "farthest": the one farthest from all colors so far, among the first `candidates`
 * - "lookahead": the one farthest from all colors so far, among the next `lookahead`
 */
export type Method = "sequence" | "farthest" | "lookahead";

/** An end zone for later colors, so they don't compete with the first ones */
export type EndZone = {
  /** "darker" or "lighter" than the tone's lightness range, or an OKLCH lightness range [min, max] */
  lightness?: "darker" | "lighter" | Range;
  /** Number of colors before the end zone, or "auto" for as many as fit minGap apart */
  midpoint?: number | "auto";
  /** Smallest OKLab distance between colors before the end zone when midpoint is "auto" */
  minGap?: number;
  /**
   * With the "sequence" method, fade into the end zone instead of switching at once:
   * a color k times the midpoint moves 1 - 1/k^steepness of the way, so for 4, 80% at
   * 1.5 times the midpoint and 94% at twice it. Infinity switches at once.
   */
  steepness?: number;
};

/** Where hues come from: "Oklch" for the OKLCH hue circle, or a d3 color scheme */
export type HueSource = "Oklch" | Scheme | SchemeName;

export type PaletteOptions = {
  /**
   * Lightness and chroma: a tone name like "strong" or "pastel", colors to infer the tone from,
   * or tone fields over the base tone. The base tone is inferred from seeds, else from a
   * scheme's colors (with the default lightness), else the default "strong".
   */
  tone?: ToneOption;
  /** Where hues come from: "Oklch" for the OKLCH hue circle (default), or a d3 color scheme name or interpolator */
  hue?: HueSource;
  /**
   * Where on the hue source the first color sits, in degrees: its hue on "Oklch", and on a
   * scheme, 360 is the whole scheme. Default 245 (blue) on "Oklch" and 0, the scheme's start, on a scheme.
   */
  offset?: number;
  /** Go around the hue circle toward higher hues, or read the scheme from 1 to 0 */
  reverse?: boolean;
  /** Colors to start the palette with, any CSS colors */
  seeds?: readonly string[];
  /** How the next color is chosen; "farthest" by default with seeds, otherwise "sequence" */
  method?: Method;
  /** Number of sequence colors "farthest" chooses from */
  candidates?: number;
  /** Number of upcoming sequence colors "lookahead" chooses from */
  lookahead?: number;
  /** Start index in the base-3 sequence that sets lightness */
  lightnessOffset?: number;
  /** Start index in the base-5 sequence that sets chroma */
  chromaOffset?: number;
  /**
   * An end zone for later colors: its lightness ("darker", "lighter" or a range) with
   * the other end zone options at their defaults, the end zone options, or false for none.
   */
  end?: EndZone | NonNullable<EndZone["lightness"]> | false;
};

export const defaultPaletteOptions = {
  tone: "strong" as const,
  hue: "Oklch" as const,
  /** On "Oklch"; a scheme starts at 0 */
  offset: 245,
  reverse: false,
  candidates: 4096,
  lookahead: 64,
  lightnessOffset: 7,
  chromaOffset: 4,
  end: false as const,
};

/** Where the first color sits by default: blue on the hue circle, the start of a scheme */
export const defaultOffset = (hue: HueSource) => (hue === "Oklch" ? defaultPaletteOptions.offset : 0);

export const defaultEndZone: Required<EndZone> = {
  lightness: "darker",
  midpoint: "auto",
  minGap: 0.04,
  steepness: Infinity,
};

/** The end zone options with defaults filled in, or undefined for no end zone */
export function endZone(end: PaletteOptions["end"] = defaultPaletteOptions.end): Required<EndZone> | undefined {
  if (end === false) return undefined;
  if (typeof end === "string" || Array.isArray(end)) return { ...defaultEndZone, lightness: end };
  return {
    lightness: end.lightness ?? defaultEndZone.lightness,
    midpoint: end.midpoint ?? defaultEndZone.midpoint,
    minGap: end.minGap ?? defaultEndZone.minGap,
    steepness: end.steepness ?? defaultEndZone.steepness,
  };
}

// Upper bound on the automatic top zone, so a tiny minGap can't make it quadratic in n
const MAX_AUTO_MIDPOINT = 1024;

/**
 * Generate categorical colors spread over hue, lightness and chroma in OKLCH.
 * The colors come from a sequence: hue from the Cantor stops (base 2), lightness from a
 * base-3 and chroma from a base-5 van der Corput sequence, together a Halton sequence.
 * The first colors come from the tone; later colors move to the end zone, if any.
 * @param n Number of colors, including seeds, or weights for the "sequence" method
 * @param options Tone, hue source, seeds, method and end zone
 * @returns hex colors
 */
export function palette(n: number | number[] = 16, options: PaletteOptions = {}) {
  const { seeds = [] } = options;
  const { method = seeds.length > 0 ? "farthest" : "sequence" } = options;
  if (method === "sequence" && seeds.length > 0) {
    throw new Error('Seeds need the "farthest" or "lookahead" method');
  }
  return method === "sequence" ? sequence(n, options) : choose(typeof n === "number" ? n : n.length, method, options);
}

/** The colors of the sequence in order, moving to the end zone after the midpoint */
function sequence(n: number | number[], options: PaletteOptions) {
  const zone = endZone(options.end);
  const { top, bottom } = paletteTones(options);
  const at = sequenceColor(options);
  const positionsFor = (count: number | number[]) => stops(count).map(({ start }) => start);

  const positions = positionsFor(n);
  const first = positions.map((position, i) => at(i, top, position));
  if (!zone) return first.map(labToHex);

  const { midpoint, minGap, steepness } = zone;
  let m = typeof midpoint === "number" ? midpoint : 0;
  if (midpoint === "auto") {
    // The top zone must not depend on n, so look past the n colors when needed.
    // Stops for a count never move when there are more of them.
    const limit = typeof n === "number" ? MAX_AUTO_MIDPOINT : Math.min(n.length, MAX_AUTO_MIDPOINT);
    const search = typeof n === "number" && n < limit ? positionsFor(limit) : positions;
    m = fitCount((i) => (i < first.length ? first[i] : at(i, top, search[i])), limit, minGap);
  }

  return first.map((lab, i) => {
    const t = zoneWeight(i, m, steepness);
    return labToHex(t === 0 ? lab : at(i, mixTone(top, bottom, t), positions[i]));
  });
}

/** Seeds first, then colors chosen from the sequence by distance; the end zone starts at once */
function choose(n: number, method: Exclude<Method, "sequence">, options: PaletteOptions) {
  const {
    seeds = [],
    candidates = defaultPaletteOptions.candidates,
    lookahead: window = defaultPaletteOptions.lookahead,
  } = options;
  const total = Math.max(0, n);
  const zone = endZone(options.end);
  const { top, bottom } = paletteTones(options);
  const at = sequenceColor(options);
  const seeded = seeds.map(parseOklab);

  const pick = (picked: Lab[], count: number, tone: Tone, stopBelow?: number) =>
    method === "farthest"
      ? farthest(picked, count, Array.from({ length: candidates }, (_, i) => at(i, tone)), stopBelow)
      : lookahead(picked, count, (i) => at(i, tone), window, stopBelow);

  if (!zone) {
    return [...seeded, ...pick(seeded, total - seeded.length, top)].slice(0, total).map(labToHex);
  }

  // Top zone: up to midpoint colors, or until a new color would be closer than minGap
  const { midpoint, minGap } = zone;
  const auto = midpoint === "auto";
  const topSize = auto ? total : Math.min(total, midpoint);
  const first = [...seeded, ...pick(seeded, topSize - seeded.length, top, auto ? minGap : undefined)];
  const rest = pick(first, total - first.length, bottom);
  return [...first, ...rest].slice(0, total).map(labToHex);
}

/**
 * The i:th color of the sequence in a tone. For a count, the Cantor stop
 * is the base-2 van der Corput value, which is the default position.
 */
function sequenceColor(options: PaletteOptions) {
  const {
    hue = defaultPaletteOptions.hue,
    reverse = defaultPaletteOptions.reverse,
    lightnessOffset = defaultPaletteOptions.lightnessOffset,
    chromaOffset = defaultPaletteOptions.chromaOffset,
  } = options;
  const hueAt = hueSource(hue, options.offset ?? defaultOffset(hue), reverse);
  return (i: number, tone: Tone, position = vanDerCorput(i, 2)) =>
    toneColor(
      tone,
      hueAt(position),
      vanDerCorput(i + lightnessOffset, 3),
      vanDerCorput(i + chromaOffset, 5),
    );
}

/**
 * The tones palette() picks from: the top tone for the first colors and the
 * end zone tone for later ones (the top tone if there is no end zone).
 */
export function paletteTones(options: PaletteOptions = {}): { top: Tone; bottom: Tone } {
  const { hue = defaultPaletteOptions.hue, seeds = [], tone } = options;
  const base = seeds.length > 0 ? inferTone(seeds) : hue === "Oklch" ? defaultTone : schemeTone(hue);
  const top = resolveTone(tone, base);
  const zone = endZone(options.end);
  if (!zone) return { top, bottom: top };
  const lightness = typeof zone.lightness === "string" ? endLightness(top.lightness, zone.lightness) : zone.lightness;
  return { top, bottom: { ...top, lightness } };
}

const fract = (x: number) => x - Math.floor(x);

const SCHEME_SAMPLES = 32;
const SCHEME_TRIM = 0.05;

/**
 * The tone palette({ hue: scheme }) uses: chroma, warm hue and tilt from the
 * center 90% of the scheme, where the ends of many schemes stick out, and the
 * default lightness, so the first colors have similar lightness.
 */
export function schemeTone(scheme: Scheme | SchemeName): Tone {
  const interpolate = typeof scheme === "string" ? getScheme(scheme) : scheme;
  if (!interpolate) throw new Error(`Unknown color scheme: ${scheme}`);
  const samples = Array.from({ length: SCHEME_SAMPLES }, (_, i) =>
    interpolate(SCHEME_TRIM + ((1 - 2 * SCHEME_TRIM) * (i + 0.5)) / SCHEME_SAMPLES),
  );
  return { ...inferTone(samples), lightness: defaultTone.lightness };
}

/** Hue in degrees at position t in [0, 1], with the first color offset degrees around the source */
function hueSource(hue: HueSource, offset: number, reverse: boolean): (t: number) => number {
  if (hue === "Oklch") {
    const direction = reverse ? 1 : -1;
    return (t) => (((offset + direction * 360 * t) % 360) + 360) % 360;
  }
  const scheme = typeof hue === "string" ? getScheme(hue) : hue;
  if (!scheme) throw new Error(`Unknown color scheme: ${hue}`);
  return (t) => {
    const u = fract(t + offset / 360);
    return parseOklch(scheme(reverse ? 1 - u : u))[2];
  };
}

/**
 * Number of leading colors that are all at least minGap apart, at most limit.
 */
function fitCount(colorAt: (i: number) => Lab, limit: number, minGap: number) {
  const colors: Lab[] = [];
  for (let i = 0; i < limit; ++i) {
    const color = colorAt(i);
    if (colors.some((c) => labDistance(c, color) < minGap)) return i;
    colors.push(color);
  }
  return limit;
}
