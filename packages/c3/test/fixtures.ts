/**
 * Shared fixtures in fixtures/c3.json at the repository root: inputs and outputs of the
 * public API that the Python port (python/) checks against, so both give the same colors.
 * Regenerate with `pnpm --filter @mapequation/c3 fixtures`.
 */
import { distance, hierarchy, inferTone, oklab, oklch, palette, swatches, tones } from "../src/index.js";
import type { HierarchyOptions, Module, PaletteOptions } from "../src/index.js";

export type FixtureCase = {
  name: string;
  fn: "palette" | "hierarchy" | "inferTone" | "oklab" | "oklch" | "distance" | "tones" | "swatches";
  args: unknown[];
  options: Record<string, unknown>;
  expected: unknown;
};

const COLORS = [
  "#fff",
  "#000",
  "#808080",
  "red",
  "steelblue",
  "  SteelBlue  ",
  "#2b9bea",
  "#abcd",
  "#11223344",
  "rgb(255, 0, 0)",
  "rgb(300, -20, 128)",
  "rgb(100%, 50%, 0%)",
  "rgba(0, 0, 255, 0.5)",
  "rgba(10%, 20%, 30%, 0.4)",
  "hsl(200, 50%, 40%)",
  "hsl(0, 0%, 50%)",
  "hsl(-90, 50%, 50%)",
  "hsl(400, 20%, 70%)",
  "hsla(30, 100%, 50%, 0.8)",
];

const SEEDS = ["steelblue", "rgb(10, 200, 30)", "hsl(300, 80%, 60%)", "#abc", "rgba(255, 128, 0, 0.5)"];

const SET1 = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628"];

const describeOptions = (options: object) => (Object.keys(options).length > 0 ? ` ${JSON.stringify(options)}` : "");

function paletteCase(n: number | number[], options: PaletteOptions = {}): FixtureCase {
  return {
    name: `palette ${JSON.stringify(n)}${describeOptions(options)}`,
    fn: "palette",
    args: [n],
    options,
    expected: palette(n, options),
  };
}

function hierarchyCase(tree: string, modules: Module[], options: HierarchyOptions = {}): FixtureCase {
  const colors = hierarchy(modules, options);
  const paths = [...modules.map((m) => m.path), [99], [1, 99, 99], [1, 1, 1, 1, 1], []];
  return {
    name: `hierarchy ${tree}${describeOptions(options)}`,
    fn: "hierarchy",
    args: [modules],
    options,
    expected: {
      modules: colors.modules,
      lookup: paths.map((path) => ({ path, color: colors(path) ?? null })),
    },
  };
}

const call = (fn: FixtureCase["fn"], args: unknown[], expected: unknown, name = `${fn} ${JSON.stringify(args)}`): FixtureCase => ({
  name,
  fn,
  args,
  options: {},
  expected,
});

const trees: Record<string, Module[]> = {
  "two levels": [
    { path: [1, 1], flow: 0.3 },
    { path: [1, 2], flow: 0.2 },
    { path: [2, 1], flow: 0.25 },
    { path: [2, 2], flow: 0.15 },
    { path: [3], flow: 0.1 },
  ],
  "missing parents and repeated paths": [
    { path: [1, 1, 1] },
    { path: [1, 1, 2] },
    { path: [1, 2] },
    { path: [2, 3, 1], flow: 2 },
    { path: [2, 3, 1], flow: 1 },
    { path: [2, 1] },
    { path: [3] },
    { path: [1], flow: 10 },
  ],
  "one top module": [
    { path: [1, 1], flow: 1 },
    { path: [1, 2], flow: 2 },
    { path: [1, 3], flow: 3 },
  ],
  "unsorted paths": [
    { path: [2, 1], flow: 0.1 },
    { path: [1, 3], flow: 0.05 },
    { path: [1, 1], flow: 0.3 },
    { path: [3, 2, 1], flow: 0.2 },
    { path: [2, 2], flow: 0.15 },
    { path: [1, 2], flow: 0.1 },
    { path: [3, 1], flow: 0.1 },
  ],
  "three levels": Array.from({ length: 6 }, (_, i) =>
    Array.from({ length: 4 }, (_, j) =>
      Array.from({ length: 3 }, (_, k) => ({ path: [i + 1, j + 1, k + 1], flow: 1 / ((i + 1) * (j + 2) * (k + 3)) })),
    ),
  )
    .flat(2)
    .reverse(),
  "zero flows": [
    { path: [1, 1], flow: 0.4 },
    { path: [1, 2], flow: 0.3 },
    { path: [2, 1], flow: 0.2 },
    { path: [2, 2], flow: 0 },
    { path: [3, 1], flow: 0 },
    { path: [3, 2], flow: 0 },
    { path: [4], flow: 0 },
    { path: [5], flow: 0 },
  ],
  "zero-flow top modules": [1, 0.5, 0.3, 0.2, 0.1, 0, 0, 0].map((flow, i) => ({ path: [i + 1], flow })),
  "all zero flows": [[1, 1], [1, 2], [2, 1], [2, 2], [3]].map((path) => ({ path, flow: 0 })),
};

export function fixtureCases(): FixtureCase[] {
  const cases: FixtureCase[] = [];
  const add = (...c: FixtureCase[]) => cases.push(...c);

  // Counts and weights
  for (const n of [0, 1, 2, 5, 30, 100]) add(paletteCase(n));
  for (const weights of [[], [3], [1, 2, 3], [5, 1, 1, 1, 1, 0.5], [1, 1, 1, 1, 1, 1, 1, 1], [0.1, 0.4, 0.2, 0.3, 0.05, 0.15, 0.6]])
    add(paletteCase(weights));

  // Zero weights
  for (const weights of [[0], [0, 0], [0, 0, 1], [1, 0, 0], [3, 0, 2, 0, 0, 1], [1, 0.5, 0.3, 0.2, 0.1, 0, 0, 0], Array(9).fill(0)])
    add(paletteCase(weights));
  add(paletteCase([0, 0, 0, 2, 1], { end: "darker" }), paletteCase([0, 1, 0, 2], { hue: "Turbo" }));

  // Tones
  for (const tone of Object.keys(tones) as (keyof typeof tones)[]) add(paletteCase(12, { tone }));
  add(
    paletteCase(20, { tone: { lightness: [0.5, 0.8], chroma: [0.05, 0.15], warmHue: 60, tilt: 0.5 } }),
    paletteCase(12, { tone: { chroma: [0.1, 0.2] } }),
    paletteCase(12, { tone: { tilt: 0.4, warmHue: 120 } }),
    paletteCase(10, { tone: [...swatches.mural] }),
    paletteCase(8, { tone: ["#ff0000", "steelblue", "hsl(120, 60%, 40%)"] }),
  );

  // Offsets and direction
  for (const offset of [0, 90, 360, 400, 725.5, -30, -400]) add(paletteCase(8, { offset }));
  for (const offset of [90, 400, -45]) add(paletteCase(8, { hue: "Turbo", offset }));
  add(
    paletteCase(8, { hue: "Sinebow", offset: 180 }),
    paletteCase(10, { reverse: true }),
    paletteCase(10, { reverse: true, offset: 30 }),
    paletteCase(10, { hue: "Turbo", reverse: true }),
    paletteCase(10, { hue: "Sinebow", reverse: true }),
    paletteCase(10, { hue: "Rainbow", reverse: true, offset: 100 }),
  );

  // Hue sources
  for (const hue of ["Oklch", "Turbo", "Sinebow", "Rainbow"] as const) add(paletteCase(30, { hue }));
  add(
    paletteCase(12, { hue: "Turbo", tone: "pastel" }),
    paletteCase(12, { hue: "Rainbow", tone: { tilt: 0 } }),
    paletteCase([1, 2, 3, 4, 5], { hue: "Sinebow" }),
  );

  // Sequence offsets
  add(
    paletteCase(16, { lightnessOffset: 0, chromaOffset: 0 }),
    paletteCase(16, { lightnessOffset: 3, chromaOffset: 11 }),
  );

  // Methods and seeds
  add(
    paletteCase(20, { method: "sequence" }),
    paletteCase(20, { method: "farthest" }),
    paletteCase(20, { method: "lookahead" }),
    paletteCase(20, { method: "farthest", candidates: 256 }),
    paletteCase(20, { method: "lookahead", lookahead: 8 }),
    paletteCase(100, { method: "farthest" }),
    paletteCase(100, { method: "lookahead" }),
    paletteCase(10, { seeds: ["#ff0000", "#00ff00"] }),
    paletteCase(12, { seeds: [...swatches.mural], method: "lookahead" }),
    paletteCase(8, { seeds: SEEDS }),
    paletteCase(2, { seeds: ["red", "green", "blue"] }),
    paletteCase(12, { method: "farthest", hue: "Turbo" }),
    paletteCase([1, 2, 3, 4, 5], { method: "lookahead" }),
  );

  // End zones with the sequence
  add(
    paletteCase(30, { end: "darker" }),
    paletteCase(30, { end: "lighter" }),
    paletteCase(30, { end: [0.3, 0.45] }),
    paletteCase(20, { end: { midpoint: 5 } }),
    paletteCase(10, { end: { midpoint: 0 } }),
    paletteCase(40, { end: { midpoint: "auto", minGap: 0.06 } }),
    paletteCase(30, { end: { lightness: "lighter", midpoint: 8, steepness: 4 } }),
    paletteCase(30, { end: { steepness: 2 } }),
    paletteCase(100, { end: "darker" }),
    paletteCase(1100, { end: "darker" }),
    paletteCase([5, 1, 1, 2, 1, 3, 1, 1, 0.5, 2, 1, 1], { end: "darker" }),
    paletteCase(30, { hue: "Turbo", end: { lightness: "lighter", steepness: 3 } }),
    paletteCase(30, { tone: "pastel", end: { lightness: [0.4, 0.6], midpoint: 10 } }),
  );

  // End zones when choosing by distance
  add(
    paletteCase(30, { method: "farthest", end: "darker" }),
    paletteCase(20, { method: "lookahead", end: { midpoint: 6 } }),
    paletteCase(20, { seeds: ["#ff0000", "#0000ff", "#00aa00"], end: { midpoint: 10 } }),
    paletteCase(20, { seeds: [...swatches.mural], end: { lightness: "lighter", minGap: 0.08 } }),
  );

  // Hierarchies
  for (const [tree, modules] of Object.entries(trees)) add(hierarchyCase(tree, modules));
  add(
    hierarchyCase("two levels", trees["two levels"]!, { padding: 0.5 }),
    hierarchyCase("two levels", trees["two levels"]!, { tone: "pastel" }),
    hierarchyCase("two levels", trees["two levels"]!, { seeds: ["#ff0000"] }),
    hierarchyCase("missing parents and repeated paths", trees["missing parents and repeated paths"]!, {
      method: "farthest",
    }),
    hierarchyCase("one top module", trees["one top module"]!, { hue: "Sinebow", reverse: true }),
    hierarchyCase("three levels", trees["three levels"]!, { end: "darker" }),
    hierarchyCase("three levels", trees["three levels"]!, { hue: "Turbo" }),
    hierarchyCase("three levels", trees["three levels"]!, { padding: 0, tone: "deep", offset: 30 }),
    hierarchyCase("three levels", trees["three levels"]!, { method: "lookahead", end: { midpoint: 3 } }),
    hierarchyCase("zero flows", trees["zero flows"]!, { method: "farthest" }),
  );

  // Tones from colors
  for (const colors of [[...swatches.mural], ["#ff0000"], ["#ff0000", "#0000ff"], [], SET1, ["#ffffff", "#808080", "#000000"], SEEDS])
    add(call("inferTone", [colors], inferTone(colors)));

  // OKLab, OKLCH and distances
  for (const color of COLORS) add(call("oklab", [color], oklab(color)));
  for (const color of COLORS) add(call("oklch", [color], oklch(color)));
  for (const [a, b] of [
    ["red", "blue"],
    ["#2b9bea", "#2b9beb"],
    ["white", "black"],
    ["steelblue", "hsl(207, 44%, 49%)"],
  ] as const)
    add(call("distance", [a, b], distance(a, b)));

  // Tables
  add(call("tones", [], tones, "tones"), call("swatches", [], swatches, "swatches"));

  return cases;
}

/** One case per line, so diffs show which cases changed */
export const serializeFixtures = (cases: FixtureCase[]) =>
  "[\n" + cases.map((c) => "  " + JSON.stringify(c)).join(",\n") + "\n]\n";

const RELATIVE_TOLERANCE = 1e-12;

/**
 * Where two parsed fixture files differ: strings exactly, numbers within a tight relative
 * tolerance, so last-bit differences in Math functions between Node versions don't count.
 */
export function fixtureDifferences(actual: unknown, expected: unknown, path = "$"): string[] {
  if (typeof actual === "number" && typeof expected === "number") {
    const close =
      actual === expected || Math.abs(actual - expected) <= RELATIVE_TOLERANCE * Math.max(Math.abs(actual), Math.abs(expected));
    return close ? [] : [`${path}: ${actual} != ${expected}`];
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return [`${path}: length ${actual.length} != ${expected.length}`];
    return actual.flatMap((a, i) => fixtureDifferences(a, expected[i], `${path}[${i}]`));
  }
  if (actual && expected && typeof actual === "object" && typeof expected === "object" && !Array.isArray(actual) && !Array.isArray(expected)) {
    const keys = [...new Set([...Object.keys(actual), ...Object.keys(expected)])];
    return keys.flatMap((key) =>
      fixtureDifferences((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key], `${path}.${key}`),
    );
  }
  return actual === expected ? [] : [`${path}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`];
}
