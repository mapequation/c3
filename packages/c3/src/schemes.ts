import * as schemes from "d3-scale-chromatic";

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
export type SchemeName = (typeof SCHEME_NAMES)[number];

/**
 * Get interpolator function from d3 scheme name
 * @param scheme d3 scheme name
 * @returns d3 interpolator
 */
export function getScheme(scheme: SchemeName): Scheme {
  const schemeName = `interpolate${scheme}`;
  // @ts-ignore
  return schemes[schemeName] as any as Scheme;
}
