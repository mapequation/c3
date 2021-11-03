export default class Node {
  children: [Node, Node] | null = null;

  constructor(
    public readonly start: number = 0,
    public readonly end: number = 1,
  ) {}

  get size() {
    return this.end - this.start;
  }

  get mid() {
    return this.start + this.size / 2;
  }

  split() {
    if (!this.children) {
      this.children = [
        new Node(this.start, this.mid),
        new Node(this.mid, this.end),
      ];
    }
    return this.children;
  }
}
