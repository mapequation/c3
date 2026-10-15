import { labDistance, type Lab } from "./oklab.js";

/**
 * Each new color is the candidate farthest from all colors so far.
 * Stops early if the farthest is closer than stopBelow. O(count * candidates).
 */
export function farthest(picked: readonly Lab[], count: number, candidates: readonly Lab[], stopBelow = 0) {
  const result: Lab[] = [];
  if (count <= 0 || candidates.length === 0) return result;

  const minDist = new Float64Array(candidates.length).fill(Infinity);
  const update = (p: Lab) => {
    for (let i = 0; i < candidates.length; ++i) {
      const d = labDistance(candidates[i], p);
      if (d < minDist[i]) minDist[i] = d;
    }
  };
  picked.forEach(update);

  while (result.length < count) {
    let best = 0;
    for (let i = 1; i < candidates.length; ++i) if (minDist[i] > minDist[best]) best = i;
    if (minDist[best] < stopBelow) break;
    result.push(candidates[best]);
    update(candidates[best]);
  }
  return result;
}

/**
 * Each new color is the farthest from all colors so far of the next `window`
 * unused candidates in a sequence. Stops early if it is closer than stopBelow.
 */
export function lookahead(
  picked: readonly Lab[],
  count: number,
  candidateAt: (i: number) => Lab,
  window: number,
  stopBelow = 0,
) {
  const result: Lab[] = [];
  if (count <= 0) return result;

  const chosen = [...picked];
  const points: Lab[] = [];
  const minDist: number[] = [];
  const used: boolean[] = [];
  let first = 0; // first unused point

  const point = (k: number) => {
    while (points.length <= k) {
      const p = candidateAt(points.length);
      points.push(p);
      minDist.push(Math.min(Infinity, ...chosen.map((q) => labDistance(p, q))));
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
    if (minDist[best] < stopBelow) break;
    const p = points[best];
    used[best] = true;
    chosen.push(p);
    result.push(p);
    for (let k = first; k < points.length; ++k) {
      const d = labDistance(points[k], p);
      if (d < minDist[k]) minDist[k] = d;
    }
    while (used[first]) ++first;
  }
  return result;
}
