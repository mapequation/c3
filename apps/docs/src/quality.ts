import { oklab } from "@mapequation/c3";

/** OKLab distance that is just noticeable side by side */
export const JUST_NOTICEABLE = 0.02;
/** OKLab distance from which categories are easy to tell apart */
export const DISTINCT = 0.04;

export type Quality = {
  /** Smallest distance between any two colors, Infinity for fewer than two colors */
  minGap: number;
  /** Indices of the closest pair, null for fewer than two colors */
  closest: [number, number] | null;
  /** Median distance from each color to its nearest neighbor, NaN for fewer than two colors */
  medianNN: number;
  /** Number of colors whose nearest neighbor is closer than JUST_NOTICEABLE */
  nearDuplicates: number;
  /** Entry k is the smallest gap among the first k colors; entries 0 and 1 are Infinity */
  prefixMin: number[];
};

function median(values: number[]) {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * How distinct a list of colors is, by Euclidean distance in OKLab.
 * O(n²) over all pairs; each color is converted once.
 */
export function quality(colors: readonly string[]): Quality {
  const labs = colors.map(oklab);
  const n = labs.length;
  const nearest = new Array<number>(n).fill(Infinity);
  const prefixMin = new Array<number>(n + 1).fill(Infinity);
  let minGap = Infinity;
  let closest: [number, number] | null = null;

  // Adding color j can only lower the smallest gap, so prefixMin builds up as j grows
  for (let j = 1; j < n; ++j) {
    const [L, a, b] = labs[j];
    for (let i = 0; i < j; ++i) {
      const [L2, a2, b2] = labs[i];
      const d = Math.sqrt((L - L2) ** 2 + (a - a2) ** 2 + (b - b2) ** 2);
      if (d < nearest[i]) nearest[i] = d;
      if (d < nearest[j]) nearest[j] = d;
      if (d < minGap) {
        minGap = d;
        closest = [i, j];
      }
    }
    prefixMin[j + 1] = minGap;
  }

  const neighbors = n >= 2 ? nearest : [];
  return {
    minGap,
    closest,
    medianNN: median(neighbors),
    nearDuplicates: neighbors.filter((d) => d < JUST_NOTICEABLE).length,
    prefixMin,
  };
}

/** First index where two palettes differ, or -1 if they agree */
export const firstDifference = (a: readonly string[], b: readonly string[]) =>
  a.findIndex((c, i) => c !== b[i]);
