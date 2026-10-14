import { getScheme, stops, type Scheme, type SchemeName } from "./c3.js";
import { vanDerCorput } from "./halton.js";
import { labDistance, labToHex, parseOklab, parseOklch, type Lab } from "./oklab.js";
import {
  defaultRegion,
  endLightness,
  inferRegion,
  mixRegion,
  regionColor,
  resolveRegion,
  zoneWeight,
  type Range,
  type Region,
} from "./region.js";
import { farthest, lookahead } from "./select.js";

/**
 * How the next color is chosen from the palette's sequence of colors:
 * - "sequence": the next one, fast and works with weights
 * - "farthest": the one farthest from all colors so far, among the first `candidates`
 * - "lookahead": the one farthest from all colors so far, among the next `lookahead`
 */
export type Method = "sequence" | "farthest" | "lookahead";

export type Zones = {
  /**
   * Lightness of an end zone for later colors, so they don't compete with the first ones:
   * "darker" or "lighter" than the lightness range, an OKLCH lightness range [min, max],
   * or false for none (default).
   */
  end?: "darker" | "lighter" | Range | false;
  /** Number of colors in the top zone, or "auto" for as many as fit minGap apart */
  midpoint?: number | "auto";
  /** Smallest OKLab distance between top zone colors when midpoint is "auto" */
  minGap?: number;
};

export type PaletteOptions = Partial<Region> &
  Zones & {
    /** Hue of the first color in degrees (OKLCH), or a d3 color scheme to take hues from */
    hue?: number | Scheme | SchemeName;
    /** Shift the stops along the hue circle or scheme, from 0 to 1 */
    offset?: number;
    /** Go around the hue circle toward higher hues, or read the scheme from 1 to 0 */
    reverse?: boolean;
    /**
     * Infer lightness, chroma and tilt from these colors. Explicit options win.
     * For a scheme, chroma and tilt are inferred from the scheme's own colors unless given.
     */
    like?: readonly string[];
    /**
     * Colors to start the palette with, any CSS colors. The palette's region is
     * inferred from them unless like or region options are given.
     */
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
     * With the "sequence" method, fade into the end zone instead of switching at once:
     * a color k times the midpoint moves 1 - 1/k^steepness of the way, so for 4, 80% at
     * 1.5 times the midpoint and 94% at twice it. Default Infinity, switching at once.
     */
    steepness?: number;
  };

export const defaultPaletteOptions = {
  hue: 125,
  offset: 0,
  reverse: false,
  candidates: 4096,
  lookahead: 64,
  lightnessOffset: 7,
  chromaOffset: 4,
  end: false as const,
  midpoint: "auto" as const,
  minGap: 0.04,
  steepness: Infinity,
};

// Upper bound on the automatic top zone, so a tiny minGap can't make it quadratic in n
const MAX_AUTO_MIDPOINT = 1024;

/**
 * Generate categorical colors spread over hue, lightness and chroma in OKLCH.
 * The colors come from a sequence: hue from the Cantor stops (base 2), lightness from a
 * base-3 and chroma from a base-5 van der Corput sequence, together a Halton sequence.
 * The first colors come from the top zone; later colors move to the end zone.
 * @param n Number of colors, including seeds, or weights for the "sequence" method
 * @param options Hue source, region, seeds, method and zones
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
  const {
    midpoint = defaultPaletteOptions.midpoint,
    minGap = defaultPaletteOptions.minGap,
    steepness = defaultPaletteOptions.steepness,
    end = defaultPaletteOptions.end,
  } = options;
  const { top, bottom } = paletteRegions(options);
  const at = sequenceColor(options);
  const positionsFor = (count: number | number[]) => stops(count).map(({ start }) => start);

  const positions = positionsFor(n);
  const first = positions.map((position, i) => at(i, top, position));
  if (end === false) return first.map(labToHex);

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
    return labToHex(t === 0 ? lab : at(i, mixRegion(top, bottom, t), positions[i]));
  });
}

/** Seeds first, then colors chosen from the sequence by distance; the end zone starts at once */
function choose(n: number, method: Exclude<Method, "sequence">, options: PaletteOptions) {
  const {
    seeds = [],
    candidates = defaultPaletteOptions.candidates,
    lookahead: window = defaultPaletteOptions.lookahead,
    midpoint = defaultPaletteOptions.midpoint,
    minGap = defaultPaletteOptions.minGap,
    end = defaultPaletteOptions.end,
  } = options;
  const total = Math.max(0, n);
  const { top, bottom } = paletteRegions(options);
  const at = sequenceColor(options);
  const seeded = seeds.map(parseOklab);

  const pick = (picked: Lab[], count: number, region: Region, stopBelow?: number) =>
    method === "farthest"
      ? farthest(picked, count, Array.from({ length: candidates }, (_, i) => at(i, region)), stopBelow)
      : lookahead(picked, count, (i) => at(i, region), window, stopBelow);

  if (end === false) {
    return [...seeded, ...pick(seeded, total - seeded.length, top)].slice(0, total).map(labToHex);
  }

  // Top zone: up to midpoint colors, or until a new color would be closer than minGap
  const auto = midpoint === "auto";
  const topSize = auto ? total : Math.min(total, midpoint);
  const first = [...seeded, ...pick(seeded, topSize - seeded.length, top, auto ? minGap : undefined)];
  const rest = pick(first, total - first.length, bottom);
  return [...first, ...rest].slice(0, total).map(labToHex);
}

/**
 * The i:th color of the sequence in a region. For a count, the Cantor stop
 * is the base-2 van der Corput value, which is the default position.
 */
function sequenceColor(options: PaletteOptions) {
  const {
    hue = defaultPaletteOptions.hue,
    offset = defaultPaletteOptions.offset,
    reverse = defaultPaletteOptions.reverse,
    lightnessOffset = defaultPaletteOptions.lightnessOffset,
    chromaOffset = defaultPaletteOptions.chromaOffset,
  } = options;
  const hueAt = hueSource(hue, reverse);
  return (i: number, region: Region, position = vanDerCorput(i, 2)) =>
    regionColor(
      region,
      hueAt(fract(position + offset)),
      vanDerCorput(i + lightnessOffset, 3),
      vanDerCorput(i + chromaOffset, 5),
    );
}

/**
 * The regions palette() picks from: the top zone for the first colors
 * and the end zone for later ones (the top zone if there is no end zone).
 */
export function paletteRegions(options: PaletteOptions = {}): { top: Region; bottom: Region } {
  const { hue = defaultPaletteOptions.hue, like, seeds = [], end = defaultPaletteOptions.end } = options;
  const base = like
    ? inferRegion(like)
    : seeds.length > 0
      ? inferRegion(seeds)
      : typeof hue === "number"
        ? undefined
        : schemeRegion(hue);
  const top = resolveRegion(options, base);
  if (end === false) return { top, bottom: top };
  const lightness = typeof end === "string" ? endLightness(top.lightness, end) : end;
  return { top, bottom: { ...top, lightness } };
}

const fract = (x: number) => x - Math.floor(x);

const SCHEME_SAMPLES = 32;
const SCHEME_TRIM = 0.05;

/**
 * The region palette({ hue: scheme }) uses: chroma, warm hue and tilt from the
 * center 90% of the scheme, where the ends of many schemes stick out, and the
 * default lightness, so the first colors have similar lightness.
 */
export function schemeRegion(scheme: Scheme | SchemeName): Region {
  const interpolate = typeof scheme === "string" ? getScheme(scheme) : scheme;
  if (!interpolate) throw new Error(`Unknown color scheme: ${scheme}`);
  const samples = Array.from({ length: SCHEME_SAMPLES }, (_, i) =>
    interpolate(SCHEME_TRIM + ((1 - 2 * SCHEME_TRIM) * (i + 0.5)) / SCHEME_SAMPLES),
  );
  return { ...inferRegion(samples), lightness: defaultRegion.lightness };
}

/** Hue in degrees at position t in [0, 1] */
function hueSource(hue: number | Scheme | SchemeName, reverse: boolean): (t: number) => number {
  if (typeof hue === "number") {
    const direction = reverse ? 1 : -1;
    return (t) => (((hue + direction * 360 * t) % 360) + 360) % 360;
  }
  const scheme = typeof hue === "string" ? getScheme(hue) : hue;
  if (!scheme) throw new Error(`Unknown color scheme: ${hue}`);
  return (t) => parseOklch(scheme(reverse ? 1 - t : t))[2];
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
