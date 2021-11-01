export class Node {
  start: number = 0;
  end: number = 1;
  children: [Node, Node] | null = null;

  constructor(start: number = 0, end: number = 1) {
    this.start = start;
    this.end = end;
  }

  get size(): number {
    return this.end - this.start;
  }

  get mid(): number {
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

export function generateArray(numColors: number = 10) {
  const numLoops = Math.ceil(Math.log2(numColors));
  const colors = [new Node()];

  for (let i = 0; i < numLoops; ++i) {
    const length = colors.length;
    for (let j = 0; j < length; ++j) {
      const [first, second] = colors[j]!.split();
      colors[j] = first;
      colors.push(second);
    }
  }

  return colors;
}
