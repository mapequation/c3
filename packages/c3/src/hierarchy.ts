import { vanDerCorput } from "./halton.js";
import { inGamut, labDistance, labToHex, labToLch, parseOklab, type Lab } from "./oklab.js";
import { palette, paletteRegions, type PaletteOptions } from "./palette.js";

export type Module = {
  /** Path from the top module, like [1, 4, 3] for the third child of the fourth child of module 1 */
  path: readonly number[];
  /** Flow or another size. Modules without flow get the sum of their children's, or 1. */
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

// Halton points in the unit ball, the candidates for child colors
const BALL_POINTS = 512;
const ball: Lab[] = [];
for (let i = 1; ball.length < BALL_POINTS; ++i) {
  const p: Lab = [2 * vanDerCorput(i, 2) - 1, 2 * vanDerCorput(i, 3) - 1, 2 * vanDerCorput(i, 5) - 1];
  if (Math.hypot(...p) <= 1) ball.push(p);
}

/**
 * Colors for nested modules. Top modules get palette() colors. Each module
 * gets a ball in OKLab around its color, splitting the distance to the other
 * modules on the same level by the square root of their flows, and its
 * children get colors as distinct as possible inside that ball.
 * @param modules Modules by path; missing parents are added
 * @param options palette() options for the top modules, and padding
 * @returns a function from path to color, which for a longer path gives the color of
 * its deepest module, with all modules in depth-first order as `modules`
 */
export function hierarchy(modules: readonly Module[], options: HierarchyOptions = {}) {
  const { padding = defaultHierarchyOptions.padding } = options;
  const nodes = buildTree(modules);
  const top = nodes.get("")!.children;

  // Keep children inside the lightness and chroma the palette uses
  const { top: topRegion, bottom } = paletteRegions(options);
  const bounds = {
    lightness: [Math.min(topRegion.lightness[0], bottom.lightness[0]), Math.max(topRegion.lightness[1], bottom.lightness[1])],
    chroma: Math.max(topRegion.chroma[1], bottom.chroma[1]),
  };
  const allowed = (lab: Lab) => {
    const [L, C] = labToLch(lab);
    return L >= bounds.lightness[0] && L <= bounds.lightness[1] && C <= bounds.chroma && inGamut(lab);
  };

  const topColors = palette(
    top.map((node) => node.flow),
    options,
  );
  top.forEach((node, i) => (node.lab = parseOklab(topColors[i])));

  for (let level = top; level.length > 0; level = ([] as TreeNode[]).concat(...level.map((node) => node.children))) {
    for (const node of level) {
      if (node.children.length === 0) continue;
      node.radius = (1 - padding) * share(node, level);
      placeChildren(node, node.radius, allowed);
    }
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
    for (let n = 1; n <= path.length; ++n) {
      const k = key(path.slice(0, n));
      if (nodes.has(k)) continue;
      const node: TreeNode = { key: k, path: path.slice(0, n), index: path[n - 1], flow: 0, children: [] };
      nodes.set(k, node);
      nodes.get(key(path.slice(0, n - 1)))!.children.push(node);
    }
    if (flow !== undefined) given.set(key(path), flow);
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
 * Largest distance from the node's color that stays on its side of every
 * other module on the level, splitting each distance by the square root of the flows.
 */
function share(node: TreeNode, level: TreeNode[]) {
  const w = Math.sqrt(node.flow);
  let radius = Infinity;
  for (const other of level) {
    if (other === node) continue;
    const v = Math.sqrt(other.flow);
    const part = w + v > 0 ? w / (w + v) : 0.5;
    radius = Math.min(radius, labDistance(node.lab!, other.lab!) * part);
  }
  return Number.isFinite(radius) ? radius : 0.05;
}

/** Farthest point sampling of Halton candidates in the ball around the parent */
function placeChildren(parent: TreeNode, radius: number, allowed: (lab: Lab) => boolean) {
  const [L, a, b] = parent.lab!;
  const candidates = ball.map((p): Lab => [L + radius * p[0], a + radius * p[1], b + radius * p[2]]).filter(allowed);
  if (candidates.length === 0) {
    for (const child of parent.children) child.lab = parent.lab;
    return;
  }
  const minDist = new Float64Array(candidates.length).fill(Infinity);
  for (const child of parent.children) {
    let best = 0;
    for (let i = 1; i < candidates.length; ++i) if (minDist[i] > minDist[best]) best = i;
    child.lab = candidates[best];
    for (let i = 0; i < candidates.length; ++i) {
      const d = labDistance(candidates[i], child.lab);
      if (d < minDist[i]) minDist[i] = d;
    }
  }
}
