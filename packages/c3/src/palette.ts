import { getScheme, stops, type Scheme, type SchemeName } from "./c3.js";
import { vanDerCorput } from "./halton.js";
import { labDistance, labToHex, parseOklch, type Lab } from "./oklab.js";
import {
  defaultEnd,
  defaultRegion,
  inferRegion,
  mixRegion,
  regionColor,
  resolveRegion,
  zoneWeight,
  type Region,
} from "./region.js";

export type Zones = {
  /**
   * Region that later colors move to, so they don't compete with the first ones.
   * Defaults to a lighter version of the top region (darker or greyer if it is
   * already light), which also fills in fields left out. false turns zones off.
   */
  end?: Partial<Region> | false;
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
    /** Start index in the base-3 sequence that sets lightness */
    lightnessOffset?: number;
    /** Start index in the base-5 sequence that sets chroma */
    chromaOffset?: number;
    /**
     * How quickly colors after the midpoint move to the end region: for the default 4,
     * 80% of the way at 1.5 times the midpoint and 94% at twice it. Infinity switches
     * at once, which keeps later colors furthest from the top zone.
     */
    steepness?: number;
  };

export const defaultPaletteOptions = {
  hue: 125,
  offset: 0,
  reverse: false,
  lightnessOffset: 7,
  chromaOffset: 4,
  midpoint: "auto" as const,
  minGap: 0.04,
  steepness: 4,
};

// Upper bound on the automatic top zone, so a tiny minGap can't make it quadratic in n
const MAX_AUTO_MIDPOINT = 1024;

/**
 * Generate categorical colors spread over hue, lightness and chroma in OKLCH.
 * Hue comes from the Cantor stops (base 2), lightness from a base-3 and
 * chroma from a base-5 van der Corput sequence, together a Halton sequence.
 * The first colors come from the top region; later colors move to the end region.
 * @param n Number of colors or an array of weights
 * @param options Hue source, color regions and zones
 * @returns hex colors
 */
export function palette(n: number | number[] = 16, options: PaletteOptions = {}) {
  const {
    hue = defaultPaletteOptions.hue,
    offset = defaultPaletteOptions.offset,
    reverse = defaultPaletteOptions.reverse,
    lightnessOffset = defaultPaletteOptions.lightnessOffset,
    chromaOffset = defaultPaletteOptions.chromaOffset,
    midpoint = defaultPaletteOptions.midpoint,
    minGap = defaultPaletteOptions.minGap,
    steepness = defaultPaletteOptions.steepness,
    end,
  } = options;
  const { top, bottom } = paletteRegions(options);

  const hueAt = hueSource(hue, reverse);
  const huesFor = (count: number | number[]) => stops(count).map(({ start }) => hueAt(fract(start + offset)));
  const colorAt = (hues: number[], i: number, region: Region) =>
    regionColor(region, hues[i], vanDerCorput(i + lightnessOffset, 3), vanDerCorput(i + chromaOffset, 5));

  const hues = huesFor(n);
  const first = hues.map((_, i) => colorAt(hues, i, top));
  if (end === false) return first.map(labToHex);

  let m = typeof midpoint === "number" ? midpoint : 0;
  if (midpoint === "auto") {
    // The top zone must not depend on n, so look past the n colors when needed.
    // Stops for a count never move when there are more of them.
    const limit = typeof n === "number" ? MAX_AUTO_MIDPOINT : Math.min(n.length, MAX_AUTO_MIDPOINT);
    const searchHues = typeof n === "number" && n < limit ? huesFor(limit) : hues;
    m = fitCount((i) => (i < first.length ? first[i] : colorAt(searchHues, i, top)), limit, minGap);
  }

  return first.map((lab, i) => {
    const t = zoneWeight(i, m, steepness);
    return labToHex(t === 0 ? lab : colorAt(hues, i, mixRegion(top, bottom, t)));
  });
}

/**
 * The regions palette() picks from: the top region for the first colors
 * and the end region for later ones (the top region if zones are off).
 */
export function paletteRegions(options: PaletteOptions = {}): { top: Region; bottom: Region } {
  const { hue = defaultPaletteOptions.hue, like, end } = options;
  const top = resolveRegion(options, like ? inferRegion(like) : typeof hue === "number" ? undefined : schemeRegion(hue));
  const bottom = end === false ? top : resolveRegion(end ?? {}, defaultEnd(top));
  return { top, bottom };
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
