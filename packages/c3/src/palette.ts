import { stops } from "./c3.js";
import { vanDerCorput } from "./halton.js";
import { labToHex } from "./oklab.js";
import { inferRegion, regionColor, resolveRegion, type Region } from "./region.js";

export type PaletteOptions = Partial<Region> & {
  /** Hue of the first color in degrees (OKLCH) */
  hue?: number;
  /** Go around the hue circle in the opposite direction */
  reverse?: boolean;
  /** Infer lightness, chroma and tilt from these colors. Explicit options win. */
  like?: readonly string[];
  /** Start index in the base-3 sequence that sets lightness */
  lightnessOffset?: number;
  /** Start index in the base-5 sequence that sets chroma */
  chromaOffset?: number;
  /** Passed to stops() */
  strength?: number;
  /** Passed to stops() */
  skewness?: number;
};

export const defaultPaletteOptions = {
  hue: 125,
  reverse: true,
  lightnessOffset: 7,
  chromaOffset: 4,
};

/**
 * Generate categorical colors spread over hue, lightness and chroma in OKLCH.
 * Hue comes from the Cantor stops (base 2), lightness from a base-3 and
 * chroma from a base-5 van der Corput sequence, together a Halton sequence.
 * @param n Number of colors or an array of weights
 * @param options Color region and starting point
 * @returns hex colors
 */
export function palette(n: number | number[] = 16, options: PaletteOptions = {}) {
  const {
    hue = defaultPaletteOptions.hue,
    reverse = defaultPaletteOptions.reverse,
    lightnessOffset = defaultPaletteOptions.lightnessOffset,
    chromaOffset = defaultPaletteOptions.chromaOffset,
    like,
    strength,
    skewness,
  } = options;
  const region = resolveRegion(options, like ? inferRegion(like) : undefined);
  const direction = reverse ? -1 : 1;

  return stops(n, { strength, skewness }).map(({ start }, i) => {
    const h = (((hue + direction * 360 * start) % 360) + 360) % 360;
    const u = vanDerCorput(i + lightnessOffset, 3);
    const v = vanDerCorput(i + chromaOffset, 5);
    return labToHex(regionColor(region, h, u, v));
  });
}
