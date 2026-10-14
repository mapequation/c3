import { oklab, type Module, type ModuleColor } from "@mapequation/c3";

/** Largest .tree input, in characters, and the most modules it may have */
export const MAX_CHARS = 2_000_000;
export const MAX_MODULES = 10_000;

const zipf = (n: number, skew: number) => {
  const w = Array.from({ length: n }, (_, i) => 1 / (i + 1) ** skew);
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / sum);
};

/** Child counts of the top modules in the library tests, largest module first */
const COUNTS = [14, 9, 6, 5, 4, 3, 2, 2, 1, 1];

/**
 * An Infomap-like tree with Zipf flows on every level, module 1 three levels deep.
 * With 10 top modules and skew 1.3 it is the tree in the library tests; other
 * numbers of top modules stretch or squeeze the child counts over them.
 */
export function sampleTree(top: number, skew: number): Module[] {
  return zipf(top, skew).flatMap((flow, i) =>
    zipf(COUNTS[Math.floor((i * COUNTS.length) / top)], skew).flatMap((childFlow, j) =>
      i === 0 && j < 3
        ? zipf(6, skew).map((f, k) => ({ path: [i + 1, j + 1, k + 1], flow: flow * childFlow * f }))
        : [{ path: [i + 1, j + 1], flow: flow * childFlow }],
    ),
  );
}

export type ParsedTree = { modules: Module[]; nodes: number; invalid: { line: number; text: string }[]; error?: string };

const NODE_LINE = /^(\d+(?::\d+)*)\s+(\S+)/;
const mb = (chars: number) => `${(chars / 1e6).toFixed(1)} MB`;

/**
 * Modules from an Infomap .tree file, with lines like `1:2:3 0.0123 "Alice" 42`.
 * The last number in the path is the node's place in its module, and a module's
 * flow is the sum of its nodes' flows. Stops at a `*Links` section, as in .ftree files.
 */
export function parseTree(text: string): ParsedTree {
  const fail = (error: string): ParsedTree => ({ modules: [], nodes: 0, invalid: [], error });
  if (text.length > MAX_CHARS) return fail(`The tree is ${mb(text.length)}; the limit is ${mb(MAX_CHARS)}.`);
  const flows = new Map<string, number>();
  const invalid: ParsedTree["invalid"] = [];
  let nodes = 0;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i].trim();
    if (line.startsWith("*")) break;
    if (!line || line.startsWith("#")) continue;
    const m = line.match(NODE_LINE);
    const flow = m ? Number(m[2]) : NaN;
    if (!m || !Number.isFinite(flow) || flow < 0) {
      invalid.push({ line: i + 1, text: line });
      continue;
    }
    ++nodes;
    // Add the flow to every module on the path; a node alone at the top is its own module
    const path = m[1].split(":");
    for (let n = 1; n <= Math.max(1, path.length - 1); ++n) {
      const key = path.slice(0, n).join(":");
      flows.set(key, (flows.get(key) ?? 0) + flow);
    }
    if (flows.size > MAX_MODULES) return fail(`The tree has more than ${MAX_MODULES.toLocaleString("en")} modules, the limit here.`);
  }
  if (nodes === 0) return { ...fail("No node lines like 1:2:3 0.0123 \"Alice\" 42 found."), invalid };
  const modules = [...flows].map(([key, flow]) => ({ path: key.split(":").map(Number), flow }));
  return { modules, nodes, invalid };
}

/** hierarchy().modules indexed by path, parent, children and level, with OKLab coordinates */
export function indexTree(modules: readonly ModuleColor[]) {
  const keys = modules.map((m) => m.path.join(":"));
  const index = new Map(keys.map((k, i) => [k, i]));
  const parent = modules.map((m) => (m.path.length > 1 ? (index.get(m.path.slice(0, -1).join(":")) ?? -1) : -1));
  const children = modules.map((): number[] => []);
  // Depth first order keeps every level sorted from left to right
  const levels: number[][] = [];
  modules.forEach((m, i) => {
    if (parent[i] >= 0) children[parent[i]].push(i);
    (levels[m.path.length - 1] ??= []).push(i);
  });
  return { modules, keys, index, parent, children, levels, labs: modules.map((m) => oklab(m.color)) };
}

export type Tree = ReturnType<typeof indexTree>;
export type Gap = { gap: number; pair: [number, number] | null };

/**
 * Smallest distance between siblings and between cousins, and how many modules are
 * closer to their parent than to any other module on the parent's level. Euclidean
 * distance in OKLab, as distance() computes, on colors converted once: O(n²) per level.
 */
export function treeQuality({ labs, parent, levels, modules }: Tree) {
  const d = (i: number, j: number) => {
    const [L, a, b] = labs[i];
    const [L2, a2, b2] = labs[j];
    return Math.sqrt((L - L2) ** 2 + (a - a2) ** 2 + (b - b2) ** 2);
  };
  const sibling: Gap = { gap: Infinity, pair: null };
  const cousin: Gap = { gap: Infinity, pair: null };
  for (const level of levels) {
    for (let x = 1; x < level.length; ++x) {
      for (let y = 0; y < x; ++y) {
        const [i, j] = [level[y], level[x]];
        const gap = d(i, j);
        const best = parent[i] === parent[j] ? sibling : cousin;
        if (gap < best.gap) Object.assign(best, { gap, pair: [i, j] });
      }
    }
  }
  let near = 0;
  let total = 0;
  parent.forEach((p, i) => {
    if (p < 0) return;
    ++total;
    const own = d(i, p);
    if (levels[modules[p].path.length - 1].every((q) => q === p || d(i, q) > own)) ++near;
  });
  return { sibling, cousin, near, total };
}
