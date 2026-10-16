import Node from "./Node.js";

export type Interval = {
  start: number;
  end: number;
};

/**
 * Subdivide [0, 1] recursively like the Cantor set: each stop's `start` is a position
 * 0, 1/2, 1/4, 3/4, 1/8, … for a count. Weights split each interval by the weights
 * on either side, so heavier stops get more space. A zero weight counts as the
 * smallest positive weight, so every stop gets some space. Stops for a count never
 * move when there are more of them.
 * @param n Number of stops or an array of weights
 */
export function stops(n: number | number[] = 10): Interval[] {
  const weights = typeof n === "number" ? Array<number>(n).fill(1) : positiveWeights(n);
  const strength = typeof n === "number" ? 0 : 1;
  const numColors = weights.length;
  if (numColors === 0) return [];

  const numLoops = Math.ceil(Math.log2(numColors));
  const intervals = [new Node(0, 1, weights[0], weights[0])];

  let currentNodeIndex = 0;
  for (let i = 0; i < numLoops; ++i) {
    const length = intervals.length;
    for (let j = 0; j < length; ++j) {
      const next = intervals[j]!.split(weights[++currentNodeIndex], strength);
      next.subLevel = j;
      intervals.push(next);
      if (intervals.length === numColors) {
        return intervals;
      }
    }
  }

  return intervals;
}

/**
 * Weights with each zero raised to the smallest positive weight, or all ones if none is
 * positive, so zero weights get the smallest share instead of none.
 */
export function positiveWeights(weights: readonly number[]): number[] {
  const smallest = weights.reduce((min, w) => (w > 0 && w < min ? w : min), Infinity);
  const zero = Number.isFinite(smallest) ? smallest : 1;
  return weights.map((w) => (w > 0 ? w : zero));
}
