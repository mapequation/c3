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

  split() {
    const child = new Node(this.mid, this.end, ++this.endLevel);
    this.end = this.mid;
    return child;
  }
}
