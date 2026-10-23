import { vanDerCorput } from "./halton.js";
import { inGamut, labDistance, labToHex, labToLch, parseOklab, type Lab } from "./oklab.js";
import { palette, paletteTones, type PaletteOptions } from "./palette.js";
import { positiveWeights } from "./stops.js";

export type Module = {
  /** Path from the top module, like [1, 4, 3] for the third child of the fourth child of module 1 */
  path: readonly number[];
  /** Finite flow or another size, summed over repeated paths. Modules without flow get the sum of their children's, or 1. */
  flow?: number;
};

export type HierarchyOptions = PaletteOptions & {
  /**
   * Fraction of the space between two modules left empty, so children
   * stay closer to their parent than to their cousins.
   */
  padding?: number;
};

/** A module with its color and the ball its children were placed in */
export type ModuleColor = {
  path: number[];
  flow: number;
  color: string;
  /** Radius in OKLab of the ball around the color that holds the children, 0 without children */
  radius: number;
};

export const defaultHierarchyOptions = {
  padding: 0.2,
};

type TreeNode = {
  key: string;
  path: number[];
  index: number;
  flow: number;
  children: TreeNode[];
  lab?: Lab;
  radius?: number;
};

const key = (path: readonly number[]) => path.join(":");

// Only +, - and *, which round the same in every language, unlike Math.hypot
const squaredDistance = (p: Lab, q: Lab) => {
  const d0 = p[0] - q[0];
  const d1 = p[1] - q[1];
  const d2 = p[2] - q[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
};

// Halton points in the unit ball, the candidates for child colors
const BALL_POINTS = 512;
const ball: Lab[] = [];
for (let i = 1; ball.length < BALL_POINTS; ++i) {
  const p: Lab = [2 * vanDerCorput(i, 2) - 1, 2 * vanDerCorput(i, 3) - 1, 2 * vanDerCorput(i, 5) - 1];
  if (squaredDistance(p, [0, 0, 0]) <= 1) ball.push(p);
}

/**
 * Colors for nested modules. Top modules get palette() colors. Each module
 * gets a ball in OKLab around its color, splitting the distance to the other
 * modules on the same level by the square root of their flows, and its
 * children get colors as distinct as possible inside that ball.
 * @param modules Modules by path, like one per node with its module path and flow; missing parents are added
 * @param options palette() options for the top modules, and padding
 * @returns a function from path to color, which for a longer path gives the color of
 * its deepest module, with all modules in depth-first order as `modules`
 */
export function hierarchy(modules: readonly Module[], options: HierarchyOptions = {}) {
  const { padding = defaultHierarchyOptions.padding } = options;
  const nodes = buildTree(modules);
  const top = nodes.get("")!.children;

  // Keep children inside the lightness and chroma ranges the palette uses, so they don't
  // grey out. Where the gamut holds a parent below the chroma range, its children may
  // go as low as the parent.
  const { top: topTone, bottom } = paletteTones(options);
  const bounds = {
    lightness: [Math.min(topTone.lightness[0], bottom.lightness[0]), Math.max(topTone.lightness[1], bottom.lightness[1])],
    chroma: [Math.min(topTone.chroma[0], bottom.chroma[0]), Math.max(topTone.chroma[1], bottom.chroma[1])],
  };
  const allowedAround = (parent: Lab) => {
    const minChroma = Math.min(bounds.chroma[0], labToLch(parent)[1]);
    return (lab: Lab) => {
      const [L, C] = labToLch(lab);
      return (
        L >= bounds.lightness[0] && L <= bounds.lightness[1] && C >= minChroma && C <= bounds.chroma[1] && inGamut(lab)
      );
    };
  };

  const topColors = palette(
    top.map((node) => node.flow),
    options,
  );
  top.forEach((node, i) => (node.lab = parseOklab(topColors[i])));

  for (let level = top; level.length > 0; level = ([] as TreeNode[]).concat(...level.map((node) => node.children))) {
    // Zero flows count as the smallest flow on the level, like zero weights in palette()
    const sizes = positiveWeights(level.map((node) => node.flow)).map(Math.sqrt);
    level.forEach((node, i) => {
      if (node.children.length === 0) return;
      node.radius = (1 - padding) * share(i, level, sizes);
      placeChildren(node, node.radius, allowedAround(node.lab!));
    });
  }

  const colors = new Map<string, string>();
  const list: ModuleColor[] = [];
  const visit = (node: TreeNode) => {
    const color = labToHex(node.lab!);
    colors.set(node.key, color);
    list.push({ path: node.path, flow: node.flow, color, radius: node.radius ?? 0 });
    node.children.forEach(visit);
  };
  top.forEach(visit);

  const lookup = (path: readonly number[]) => {
    for (let n = path.length; n > 0; --n) {
      const color = colors.get(key(path.slice(0, n)));
      if (color) return color;
    }
    return undefined;
  };
  return Object.assign(lookup, { modules: list as readonly ModuleColor[] });
}

function buildTree(modules: readonly Module[]) {
  const nodes = new Map<string, TreeNode>([["", { key: "", path: [], index: 0, flow: 0, children: [] }]]);
  const given = new Map<string, number>();

  for (const { path, flow } of modules) {
    if (path.some(Number.isNaN)) throw new RangeError(`Invalid path: [${path.join(", ")}]`);
    if (flow !== undefined && !Number.isFinite(flow)) {
      throw new RangeError(`Flow must be finite, got ${flow} for module [${path.join(", ")}]`);
    }
    for (let n = 1; n <= path.length; ++n) {
      const k = key(path.slice(0, n));
      if (nodes.has(k)) continue;
      const node: TreeNode = { key: k, path: path.slice(0, n), index: path[n - 1], flow: 0, children: [] };
      nodes.set(k, node);
      nodes.get(key(path.slice(0, n - 1)))!.children.push(node);
    }
    if (flow !== undefined) given.set(key(path), (given.get(key(path)) ?? 0) + flow);
  }

  // Children in path order, which for Infomap is by flow
  const sum = (node: TreeNode): number => {
    node.children.sort((a, b) => a.index - b.index);
    const childFlow = node.children.reduce((s, child) => s + sum(child), 0);
    node.flow = given.get(node.key) ?? (node.children.length > 0 ? childFlow : 1);
    return node.flow;
  };
  sum(nodes.get("")!);
  return nodes;
}

/**
 * Largest distance from the color of the i:th module on the level that stays on its side
 * of every other module there, splitting each distance by the sizes, the square roots of the flows.
 */
function share(i: number, level: TreeNode[], sizes: number[]) {
  const node = level[i];
  const w = sizes[i];
  let radius = Infinity;
  level.forEach((other, j) => {
    if (j === i) return;
    radius = Math.min(radius, labDistance(node.lab!, other.lab!) * (w / (w + sizes[j])));
  });
  return Number.isFinite(radius) ? radius : 0.05;
}

/**
 * Farthest point sampling of Halton candidates in the ball around the parent. The distances
 * are between the unit ball points, the same for every parent and in every language, so
 * near-ties between candidates break the same way in the Python port.
 */
function placeChildren(parent: TreeNode, radius: number, allowed: (lab: Lab) => boolean) {
  const [L, a, b] = parent.lab!;
  const at = (p: Lab): Lab => [L + radius * p[0], a + radius * p[1], b + radius * p[2]];
  const points = ball.filter((p) => allowed(at(p)));
  if (points.length === 0) {
    for (const child of parent.children) child.lab = parent.lab;
    return;
  }
  const minDist = new Float64Array(points.length).fill(Infinity);
  for (const child of parent.children) {
    let best = 0;
    for (let i = 1; i < points.length; ++i) if (minDist[i] > minDist[best]) best = i;
    const point = points[best];
    child.lab = at(point);
    for (let i = 0; i < points.length; ++i) {
      const d = squaredDistance(points[i], point);
      if (d < minDist[i]) minDist[i] = d;
    }
  }
}
