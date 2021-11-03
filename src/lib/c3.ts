export class Node {
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

type Scheme = (value: number) => string;
export class C3 {
  constructor(public readonly scheme?: Scheme | null) {}
}

export function generateArray(numColors: number = 10): Node[] {
  const numLoops = Math.ceil(Math.log2(numColors));
  const colors = [new Node()];

  for (let i = 0; i < numLoops; ++i) {
    const length = colors.length;
    for (let j = 0; j < length; ++j) {
      const [first, second] = colors[j]!.split();
      colors[j] = first;
      colors.push(second);
      if (colors.length === numColors) {
        return colors;
      }
    }
  }

  return colors;
}
