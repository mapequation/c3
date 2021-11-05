import type { Interval } from "./c3";

export default class Node implements Interval {
  endLevel: number;

  constructor(
    public readonly start: number = 0,
    public end: number = 1,
    public readonly startLevel: number = 0,
  ) {
    this.endLevel = this.startLevel;
  }

  get size() {
    return this.end - this.start;
  }

  get mid() {
    return this.start + this.size / 2;
  }

  getSplitPoint(skewness: number = 0) {
    return this.start + (this.size / 2) * (1 + skewness);
  }

  split(skewness: number = 0) {
    const splitPoint = this.getSplitPoint(skewness);
    const child = new Node(splitPoint, this.end, ++this.endLevel);
    this.end = splitPoint;
    return child;
  }
}
