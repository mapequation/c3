import type { Interval } from "./c3.js";

export default class Node implements Interval {
  endLevel: number;
  subLevel: number;

  constructor(
    public start: number = 0,
    public end: number = 1,
    public readonly startWeight: number = 1,
    public endWeight: number = 1,
    public readonly startLevel: number = 0,
  ) {
    this.endLevel = this.startLevel;
    this.subLevel = 0;
  }

  get size() {
    return this.end - this.start;
  }

  get mid() {
    return this.start + this.size / 2;
  }

  get weightedFraction() {
    return this.startWeight / (this.startWeight + this.endWeight);
  }

  get weightedSplitPoint() {
    return this.start + this.weightedFraction * this.size;
  }

  getSplitPoint(strength: number = 1) {
    // Convex combination of unweighted and weighted split point
    const fraction = (1 - strength) * 0.5 + strength * this.weightedFraction;
    return this.start + fraction * this.size;
  }

  split(weight: number = 1, strength: number = 1) {
    const splitPoint = this.getSplitPoint(strength);
    const child = new Node(
      splitPoint,
      this.end,
      weight,
      this.endWeight,
      ++this.endLevel,
    );
    this.end = splitPoint;
    this.endWeight = weight;
    return child;
  }
}
