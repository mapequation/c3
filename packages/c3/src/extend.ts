import { distance, labToHex, parseOklab, type Lab } from "./oklab.js";
import { haltonColor, inferRegion, resolveRegion, type Region } from "./region.js";

export type ExtendOptions = Partial<Region> & {
  /**
   * greedy: each new color is the candidate farthest from all colors so far.
   * halton: each new color is the best of the next few Halton points.
   */
  method?: "greedy" | "halton";
  /** Number of candidate colors for the greedy method */
  candidates?: number;
  /** Number of Halton points considered per color for the halton method */
  window?: number;
  /** Hue offset in degrees for the candidate sequence */
  hue?: number;
};

export const defaultExtendOptions = {
  method: "greedy" as const,
  candidates: 4096,
  window: 64,
  hue: 0,
};

/**
 * Extend a palette with new colors that are as distinct as possible from the given ones.
 * Unless given, lightness, chroma and tilt are inferred from the seed colors.
 * Deterministic, and asking for more colors never changes the earlier ones.
 * @param seeds Colors to keep first, any CSS color strings
 * @param n Total number of colors, including the seeds
 * @param options Color region and method
 * @returns hex colors, starting with the seeds
 */
export function extend(seeds: readonly string[], n: number, options: ExtendOptions = {}) {
  const {
    method = defaultExtendOptions.method,
    candidates = defaultExtendOptions.candidates,
    window = defaultExtendOptions.window,
    hue = defaultExtendOptions.hue,
  } = options;
  const region = resolveRegion(options, inferRegion(seeds));
  const picked = seeds.map(parseOklab);

  const added =
    method === "greedy"
      ? greedy(picked, n - picked.length, region, candidates, hue)
      : bestCandidate(picked, n - picked.length, region, window, hue);

  return [...picked, ...added].slice(0, Math.max(0, n)).map(labToHex);
}

/**
 * Farthest point sampling over a fixed set of Halton candidates in the region.
 * O(n * candidates).
 */
function greedy(seeds: Lab[], count: number, region: Region, numCandidates: number, hue: number) {
  const result: Lab[] = [];
  if (count <= 0) return result;

  const candidates = Array.from({ length: numCandidates }, (_, i) => haltonColor(region, i, hue));
  const minDist = new Float64Array(numCandidates).fill(Infinity);
  const update = (p: Lab) => {
    for (let i = 0; i < numCandidates; ++i) {
      const d = distance(candidates[i], p);
      if (d < minDist[i]) minDist[i] = d;
    }
  };
  seeds.forEach(update);

  while (result.length < count) {
    let best = 0;
    for (let i = 1; i < numCandidates; ++i) {
      if (minDist[i] > minDist[best]) best = i;
    }
    const p = candidates[best];
    result.push(p);
    update(p);
  }
  return result;
}

/**
 * Best candidate sampling along a Halton sequence in the region:
 * each new color is the one of the next `window` unused points
 * that is farthest from all colors so far.
 */
function bestCandidate(seeds: Lab[], count: number, region: Region, window: number, hue: number) {
  const result: Lab[] = [];
  if (count <= 0) return result;

  const picked = [...seeds];
  const points: Lab[] = [];
  const minDist: number[] = [];
  const used: boolean[] = [];
  let first = 0; // first unused point

  const point = (k: number) => {
    while (points.length <= k) {
      const p = haltonColor(region, points.length, hue);
      points.push(p);
      minDist.push(Math.min(Infinity, ...picked.map((q) => distance(p, q))));
      used.push(false);
    }
    return k;
  };

  while (result.length < count) {
    let best = -1;
    for (let k = first, seen = 0; seen < window; ++k) {
      if (used[point(k)]) continue;
      ++seen;
      if (best === -1 || minDist[k] > minDist[best]) best = k;
    }
    const p = points[best];
    used[best] = true;
    picked.push(p);
    result.push(p);
    for (let k = first; k < points.length; ++k) {
      const d = distance(points[k], p);
      if (d < minDist[k]) minDist[k] = d;
    }
    while (used[first]) ++first;
  }
  return result;
}
