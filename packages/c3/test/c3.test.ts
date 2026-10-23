import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { distance, hierarchy, inferTone, palette, swatches, tones, type Module, type ModuleColor } from "../src/index.js";
import { defaultTone, endLightness, getScheme, stops, vanDerCorput } from "../src/internal.js";
import { labDistance, parseOklab, parseOklch } from "../src/oklab.js";

const beforeZones: Record<string, string[]> = JSON.parse(
  readFileSync(new URL("./palette-before-zones.json", import.meta.url), "utf8"),
);

const HEX = /^#[0-9a-f]{6}$/;

function minDistance(hex: string[]) {
  const lab = hex.map(parseOklab);
  let min = Infinity;
  for (let i = 0; i < lab.length; ++i)
    for (let j = 0; j < i; ++j) min = Math.min(min, labDistance(lab[i]!, lab[j]!));
  return min;
}

describe("vanDerCorput", () => {
  it("matches the unweighted Cantor stops in base 2", () => {
    const starts = stops(32).map(({ start }) => start);
    expect(starts).toEqual(starts.map((_, i) => vanDerCorput(i, 2)));
  });

  it("mirrors digits in base 3", () => {
    expect([0, 1, 2, 3, 4].map((i) => vanDerCorput(i, 3))).toEqual([0, 1 / 3, 2 / 3, 1 / 9, 4 / 9]);
  });
});

describe("palette()", () => {
  it("returns n hex colors", () => {
    expect(palette(0)).toEqual([]);
    const p = palette(50);
    expect(p).toHaveLength(50);
    for (const c of p) expect(c).toMatch(HEX);
  });

  it("is deterministic and consistent when n grows", () => {
    expect(palette(30)).toEqual(palette(30));
    expect(palette(60).slice(0, 30)).toEqual(palette(30));
  });

  it("stays within the lightness range", () => {
    for (const c of palette(100, { tone: { lightness: [0.6, 0.7] } })) {
      const [L] = parseOklch(c);
      expect(L).toBeGreaterThan(0.59);
      expect(L).toBeLessThan(0.71);
    }
  });

  it("keeps the first 20 colors distinct", () => {
    expect(minDistance(palette(20))).toBeGreaterThan(0.04);
  });

  it("starts at the offset hue on the hue circle, 245 by default", () => {
    const circular = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
    expect(circular(parseOklch(palette(1)[0]!)[2], 245)).toBeLessThan(1);
    expect(circular(parseOklch(palette(1, { offset: 30 })[0]!)[2], 30)).toBeLessThan(1);
    expect(palette(20, { offset: 400 })).toEqual(palette(20, { offset: 40 }));
    expect(palette(20, { hue: "Oklch" })).toEqual(palette(20));
  });

  it("changes the first color with the offset but not the spacing", () => {
    const a = palette(20, { offset: 0 });
    const b = palette(20, { offset: 180 });
    expect(a[0]).not.toEqual(b[0]);
    expect(minDistance(b)).toBeGreaterThan(0.03);
  });

  it("accepts weights", () => {
    expect(palette([1, 2, 3])).toHaveLength(3);
  });

  it("gives zero weights valid, distinct colors", () => {
    for (const weights of [[0], [0, 0], [0, 0, 1], [1, 0, 0], [5, 0, 0, 0, 0, 0, 0, 1], Array(9).fill(0), [3, 0, 2, 0, 0, 1]]) {
      const colors = palette(weights);
      expect(colors).toHaveLength(weights.length);
      for (const c of colors) expect(c).toMatch(HEX);
      if (weights.length > 1) expect(minDistance(colors)).toBeGreaterThan(0.02);
    }
  });

  it("counts a zero weight as the smallest positive weight, and all zeros as equal weights", () => {
    expect(palette([3, 0, 2, 0, 0.5])).toEqual(palette([3, 0.5, 2, 0.5, 0.5]));
    expect(palette([0, 0, 0, 0, 0])).toEqual(palette(5));
  });
});

describe("stops()", () => {
  it("gives zero weights their own stops", () => {
    for (const weights of [[0, 0, 1], [1, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0]]) {
      const starts = stops(weights).map(({ start }) => start);
      expect(starts.every(Number.isFinite)).toBe(true);
      expect(new Set(starts).size).toBe(weights.length);
    }
  });

  it("throws on weights that aren't finite", () => {
    for (const w of [Infinity, -Infinity, NaN]) expect(() => stops([1, w])).toThrow(/Weights must be finite/);
  });
});

describe("palette() without zones", () => {
  it("is unchanged from before zones were added, with the soft tone and the old default hue", () => {
    const offset = 125;
    expect(palette(50, { tone: "soft", offset })).toEqual(beforeZones.default);
    expect(palette(30, { tone: "soft", offset: 40 })).toEqual(beforeZones.hue40);
    expect(palette(30, { tone: swatches.mural, offset })).toEqual(beforeZones.likeMural);
    expect(palette([5, 1, 3, 2, 8], { tone: "soft", offset })).toEqual(beforeZones.weights);
  });
});

describe("palette({ tone })", () => {
  const range = (colors: string[], k: 0 | 1) => {
    const xs = colors.map((c) => parseOklch(c)[k]);
    return [Math.min(...xs), Math.max(...xs)];
  };

  it("is strong by default", () => {
    expect(palette(30)).toEqual(palette(30, { tone: "strong" }));
    expect(palette(30)).toEqual(palette(30, { tone: tones.strong }));
  });

  it("keeps each named tone's lightness and chroma, up to the gamut", () => {
    for (const tone of Object.keys(tones) as (keyof typeof tones)[]) {
      const colors = palette(50, { tone });
      const [L0, L1] = range(colors, 0);
      const [, C1] = range(colors, 1);
      expect(L0).toBeGreaterThan(tones[tone].lightness[0] - 0.01);
      expect(L1).toBeLessThan(tones[tone].lightness[1] + 0.01);
      expect(C1).toBeLessThan(tones[tone].chroma[1] + 0.01);
    }
  });

  it("puts tone fields over the base tone, and infers a tone from colors", () => {
    const lighter = palette(20, { tone: { lightness: [0.8, 0.9] } });
    expect(range(lighter, 0)[0]).toBeGreaterThan(0.79);
    expect(range(lighter, 1)[1]).toBeGreaterThan(0.12); // strong chroma kept
    expect(palette(20, { tone: swatches.mural })).toEqual(palette(20, { tone: inferTone(swatches.mural) }));
  });

  it("takes the base tone from seeds, which a tone overrides", () => {
    const seeds = swatches.mural;
    expect(palette(20, { seeds })).toEqual(palette(20, { seeds, tone: inferTone(seeds) }));
    expect(palette(20, { seeds, tone: "vivid" })).not.toEqual(palette(20, { seeds }));
    const lighter = palette(20, { seeds, tone: { lightness: [0.85, 0.9] } }).slice(seeds.length);
    expect(range(lighter, 0)[0]).toBeGreaterThan(0.84);
    expect(range(lighter, 1)[1]).toBeLessThan(inferTone(seeds).chroma[1] + 0.01);
  });

  it("throws on unknown tone names", () => {
    // @ts-expect-error unknown tone
    expect(() => palette(5, { tone: "neon" })).toThrow(/Unknown tone/);
    // @ts-expect-error not an own property
    expect(() => palette(5, { tone: "toString" })).toThrow(/Unknown tone/);
  });
});

describe("palette() zones", () => {
  const end: [number, number] = [0.9, 0.95];
  const lightness = (colors: string[]) => colors.map((c) => parseOklch(c)[0]);

  it("switches to the end region at the midpoint", () => {
    const L = lightness(palette(40, { end: { lightness: end, midpoint: 10 } }));
    for (const l of L.slice(0, 10)) expect(l).toBeLessThan(0.84);
    for (const l of L.slice(10)) expect(l).toBeGreaterThan(0.89);
  });

  it("puts as many colors as fit minGap apart in the top zone", () => {
    const colors = palette(100, { end });
    const m = lightness(colors).findIndex((l) => l > 0.89);
    expect(m).toBeGreaterThan(10);
    // hex rounding can shrink a distance slightly
    expect(minDistance(colors.slice(0, m))).toBeGreaterThan(0.038);
    expect(minDistance(palette(m + 1, { end: false }))).toBeLessThan(0.04);
  });

  it("is consistent when n grows, also with an automatic midpoint and a fade", () => {
    const fade = { end: { steepness: 4 } };
    for (const n of [5, 15, 21, 22, 23, 40]) {
      expect(palette(100, fade).slice(0, n)).toEqual(palette(n, fade));
      expect(palette(100, { ...fade, hue: "Turbo" }).slice(0, n)).toEqual(palette(n, { ...fade, hue: "Turbo" }));
    }
  });

  it("fades with a finite steepness", () => {
    const L = lightness(palette(60, { end: { lightness: end, steepness: 4 } }));
    expect(L.slice(10, 40).some((l) => l > 0.77 && l < 0.9)).toBe(true);
  });

  it("keeps the top zone apart from later colors", () => {
    const colors = palette(250, { end: "darker" });
    // The first color below the top zone, between it and the darker end zone
    const m = lightness(colors).findIndex((l) => l < (defaultTone.lightness[0] + endLightness(defaultTone.lightness)[1]) / 2);
    const top = colors.slice(0, m).map(parseOklab);
    const rest = colors.slice(m).map(parseOklab);
    const gap = Math.min(...top.flatMap((a) => rest.map((b) => labDistance(a, b))));
    expect(gap).toBeGreaterThan(0.03);
  });

  it("fades smoothly with a finite steepness", () => {
    const L = lightness(palette(200, { end: { lightness: end, midpoint: 10, steepness: 3 } }));
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(L.slice(0, 5))).toBeLessThan(0.8);
    expect(mean(L.slice(100))).toBeGreaterThan(0.88);
    expect(L.slice(8, 30).some((l) => l > 0.77 && l < 0.9)).toBe(true);
  });
});

describe("end zone", () => {
  it("is just below the top zone by default, or just above with \"lighter\"", () => {
    const [min, max] = defaultTone.lightness;
    const darker = endLightness(defaultTone.lightness);
    const lighter = endLightness(defaultTone.lightness, "lighter");
    expect(darker[1]).toBeCloseTo(min - 0.03, 9);
    expect(darker[1] - darker[0]).toBeCloseTo(0.22, 9);
    expect(lighter[0]).toBeCloseTo(max + 0.03, 9);
    expect(lighter[1]).toBeLessThanOrEqual(0.95);
  });

  it("is chosen with end: \"darker\", \"lighter\", a lightness range or false", () => {
    const L = (colors: string[]) => colors.slice(40).map((c) => parseOklch(c)[0]);
    const midpoint = 20;
    const darker = endLightness(defaultTone.lightness);
    const lighter = endLightness(defaultTone.lightness, "lighter");
    for (const l of L(palette(60, { end: { lightness: "darker", midpoint } }))) expect(l).toBeLessThan(darker[1] + 0.01);
    for (const l of L(palette(60, { end: { lightness: "lighter", midpoint } }))) expect(l).toBeGreaterThan(lighter[0] - 0.01);
    for (const l of L(palette(60, { end: { lightness: [0.5, 0.55], midpoint } }))) expect(l).toBeLessThan(0.56);
    expect(palette(60, { end: { midpoint } })).toEqual(palette(60, { end: { lightness: "darker", midpoint } }));
    expect(palette(60, { end: "lighter" })).toEqual(palette(60, { end: { lightness: "lighter" } }));
    expect(palette(60, { end: false })).toEqual(palette(60));
  });
});

describe("palette({ hue: scheme })", () => {
  const circular = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
  const schemeColors = (n: number, scheme: Parameters<typeof getScheme>[0]) =>
    stops(n).map(({ start }) => getScheme(scheme)(start));

  it("takes hues from the scheme at the Cantor stops", () => {
    const fromScheme = schemeColors(20, "Sinebow");
    const fromPalette = palette(20, { hue: "Sinebow" });
    fromPalette.forEach((c, i) => {
      expect(circular(parseOklch(c)[2], parseOklch(fromScheme[i]!)[2])).toBeLessThan(6);
    });
  });

  it("is more distinct than the scheme's own colors at the same stops", () => {
    for (const scheme of ["Sinebow", "Turbo", "Spectral"] as const) {
      expect(minDistance(palette(10, { hue: scheme }))).toBeGreaterThan(minDistance(schemeColors(10, scheme)));
      expect(minDistance(palette(50, { hue: scheme }))).toBeGreaterThan(minDistance(schemeColors(50, scheme)));
    }
  });

  it("starts at the scheme's start, and offset moves along it in degrees", () => {
    const sinebow = getScheme("Sinebow");
    const hueAt = (t: number) => parseOklch(sinebow(t))[2];
    expect(circular(parseOklch(palette(1, { hue: "Sinebow" })[0]!)[2], hueAt(0))).toBeLessThan(6);
    expect(circular(parseOklch(palette(1, { hue: "Sinebow", offset: 90 })[0]!)[2], hueAt(0.25))).toBeLessThan(6);
  });

  it("accepts an interpolator and throws on unknown names", () => {
    expect(palette(5, { hue: (t: number) => `hsl(${t * 360}, 80%, 50%)` })).toHaveLength(5);
    // @ts-expect-error unknown scheme
    expect(() => palette(5, { hue: "Nope" })).toThrow(/Unknown color scheme/);
  });
});

describe("palette({ seeds })", () => {
  const seeds = swatches.mural;

  for (const method of ["farthest", "lookahead"] as const) {
    describe(method, () => {
      it("keeps the seeds first", () => {
        expect(palette(20, { seeds, method }).slice(0, 5)).toEqual([...seeds]);
      });

      it("is deterministic and consistent when n grows", () => {
        const a = palette(25, { seeds, method });
        expect(palette(25, { seeds, method })).toEqual(a);
        expect(palette(50, { seeds, method }).slice(0, 25)).toEqual(a);
      });

      it("adds distinct colors", () => {
        const p = palette(20, { seeds, method });
        expect(p).toHaveLength(20);
        for (const c of p) expect(c).toMatch(HEX);
        expect(minDistance(p)).toBeGreaterThan(0.04);
      });

      it("fills the top zone minGap apart, then the end zone", () => {
        const end: [number, number] = [0.9, 0.95];
        const colors = palette(120, { seeds, method, end });
        const L = colors.map((c) => parseOklch(c)[0]);
        const m = L.findIndex((l, i) => i >= seeds.length && l > 0.89);
        expect(m).toBeGreaterThan(seeds.length + 5);
        for (const l of L.slice(m)) expect(l).toBeGreaterThan(0.89);
        expect(minDistance(colors.slice(seeds.length, m))).toBeGreaterThan(0.038);
        expect(palette(60, { seeds, method, end })).toEqual(colors.slice(0, 60));
      });
    });
  }

  it("uses farthest by default with seeds, and needs it or lookahead", () => {
    expect(palette(20, { seeds })).toEqual(palette(20, { seeds, method: "farthest" }));
    expect(() => palette(20, { seeds, method: "sequence" })).toThrow(/farthest/);
  });

  it("needs at least one candidate and a lookahead of at least one", () => {
    expect(() => palette(3, { method: "farthest", candidates: 0 })).toThrow(RangeError);
    expect(() => palette(3, { method: "lookahead", lookahead: 0 })).toThrow(RangeError);
  });

  it("switches to the end zone at a fixed midpoint", () => {
    const L = palette(30, { seeds, end: { lightness: [0.9, 0.95], midpoint: 12 } }).map((c) => parseOklch(c)[0]);
    for (const l of L.slice(5, 12)) expect(l).toBeLessThan(0.84);
    for (const l of L.slice(12)) expect(l).toBeGreaterThan(0.89);
  });

  it("truncates when n is smaller than the number of seeds", () => {
    expect(palette(3, { seeds })).toEqual(seeds.slice(0, 3));
    expect(palette(0, { seeds })).toEqual([]);
  });

  it("works without seeds", () => {
    expect(palette(10, { method: "farthest" })).toHaveLength(10);
    expect(minDistance(palette(20, { method: "farthest", end: false }))).toBeGreaterThan(
      minDistance(palette(20, { end: false })),
    );
  });

  it("accepts any CSS color and throws on invalid ones", () => {
    expect(palette(4, { seeds: ["red", "rgb(0, 0, 255)"] }).slice(0, 2)).toEqual(["#ff0000", "#0000ff"]);
    expect(() => palette(4, { seeds: ["not a color"] })).toThrow(/Invalid color/);
  });
});

describe("inferTone()", () => {
  it("finds the mural's lightness and chroma ranges and warm hue", () => {
    const r = inferTone(swatches.mural);
    expect(r.lightness[0]).toBeCloseTo(0.648, 2);
    expect(r.lightness[1]).toBeCloseTo(0.818, 2);
    expect(r.chroma[0]).toBeCloseTo(0.029, 2);
    expect(r.chroma[1]).toBeCloseTo(0.119, 2);
    expect(r.warmHue).toBeGreaterThan(20);
    expect(r.warmHue).toBeLessThan(70);
    expect(r.tilt).toBeGreaterThan(0);
  });

  it("widens a single color to a usable range", () => {
    const r = inferTone(["#808080"]);
    expect(r.lightness[1] - r.lightness[0]).toBeGreaterThanOrEqual(0.1 - 1e-9);
    expect(r.tilt).toBe(0);
  });
});

describe("distance()", () => {
  it("is zero for equal colors and symmetric", () => {
    expect(distance("#afb581", "rgb(175, 181, 129)")).toBe(0);
    expect(distance("red", "blue")).toBeCloseTo(distance("blue", "red"), 12);
  });

  it("is about 1 between black and white", () => {
    expect(distance("black", "white")).toBeCloseTo(1, 3);
  });
});

describe("hierarchy()", () => {
  const zipf = (n: number) => {
    const w = Array.from({ length: n }, (_, i) => 1 / (i + 1));
    const s = w.reduce((a, b) => a + b);
    return w.map((x) => x / s);
  };
  // Infomap-like: a few large modules with many submodules, module 1 three levels deep
  const counts = [14, 9, 6, 5, 4, 3, 2, 2, 1, 1];
  const modules = zipf(10).flatMap((flow, i) =>
    zipf(counts[i]!).flatMap((childFlow, j) =>
      i === 0 && j < 3
        ? zipf(6).map((f, k) => ({ path: [i + 1, j + 1, k + 1], flow: flow * childFlow * f }))
        : [{ path: [i + 1, j + 1], flow: flow * childFlow }],
    ),
  );
  const color = hierarchy(modules);
  const level2 = [...new Set(modules.map((m) => m.path.slice(0, 2).join(":")))].map((k) => k.split(":").map(Number));

  it("gives top modules palette() colors by flow", () => {
    const flows = zipf(10).map((f, i) => modules.filter((m) => m.path[0] === i + 1).reduce((s, m) => s + m.flow, 0));
    const top = palette(flows);
    top.forEach((c, i) => expect(color([i + 1])).toBe(c));
  });

  it("keeps siblings distinct", () => {
    for (let p = 1; p <= 8; ++p) {
      const siblings = level2.filter((path) => path[0] === p).map(color) as string[];
      expect(minDistance(siblings)).toBeGreaterThan(0.02);
    }
  });

  it("keeps children closer to their parent than to most other top modules", () => {
    const tops = Array.from({ length: 10 }, (_, i) => [i + 1]);
    const own = level2.filter((path) => {
      const nearest = tops.reduce((best, t) => (distance(color(path)!, color(t)!) < distance(color(path)!, color(best)!) ? t : best));
      return nearest[0] === path[0];
    });
    expect(own.length / level2.length).toBeGreaterThan(0.9);
  });

  it("falls back to the deepest known module and adds missing parents", () => {
    expect(color([1, 1, 2, 99])).toBe(color([1, 1, 2]));
    expect(color([1, 1])).toMatch(HEX);
    expect(color([11])).toBeUndefined();
  });

  it("keeps the other colors here when module 7 gets a new child, with module flows given", () => {
    const flow7 = modules.filter((m) => m.path[0] === 7).reduce((s, m) => s + m.flow, 0);
    const before = hierarchy([...modules, { path: [7], flow: flow7 }]);
    const after = hierarchy([...modules, { path: [7], flow: flow7 }, { path: [7, 3], flow: 0.001 }]);
    for (const { path } of modules) expect(after(path)).toBe(before(path));
  });

  it("lists all modules depth first with their balls", () => {
    expect(color.modules[0]!.path).toEqual([1]);
    expect(color.modules[1]!.path).toEqual([1, 1]);
    expect(color.modules.length).toBe(10 + level2.length + 18);
    for (const m of color.modules) {
      expect(m.color).toBe(color(m.path));
      const parent = color.modules.find((p) => p.path.join(":") === m.path.slice(0, -1).join(":"));
      if (parent) expect(distance(m.color, parent.color)).toBeLessThanOrEqual(parent.radius + 0.01);
      if (m.radius > 0) expect(modules.some((x) => x.path.length > m.path.length && x.path[0] === m.path[0])).toBe(true);
    }
  });

  it("is deterministic and works without flows", () => {
    expect(hierarchy(modules)([3, 2])).toBe(color([3, 2]));
    const plain = hierarchy(modules.map(({ path }) => ({ path })));
    expect(minDistance(level2.filter((p) => p[0] === 1).map(plain) as string[])).toBeGreaterThan(0.02);
  });

  it("sums the flows of repeated paths, so it takes one entry per node", () => {
    const nodes = modules.flatMap(({ path, flow }) => [
      { path, flow: flow / 4 },
      { path, flow: (3 * flow) / 4 },
    ]);
    const fromNodes = hierarchy(nodes);
    for (const { path } of modules) expect(fromNodes(path)).toBe(color(path));
  });

  it("colors zero-flow modules distinctly, also adjacent ones and their children", () => {
    const trees: Module[][] = [
      // Infomap order: zero-flow modules last
      [1, 0.5, 0.3, 0.2, 0.1, 0, 0, 0].map((flow, i) => ({ path: [i + 1], flow })),
      [{ path: [1], flow: 0 }, { path: [2], flow: 0 }],
      [
        { path: [1, 1], flow: 0.6 },
        { path: [1, 2], flow: 0.4 },
        { path: [2, 1], flow: 0 },
        { path: [2, 2], flow: 0 },
        { path: [2, 3], flow: 0 },
        { path: [3], flow: 0 },
      ],
      [[1, 1], [1, 2], [2, 1]].map((path) => ({ path, flow: 0 })),
    ];
    for (const modules of trees) {
      const h = hierarchy(modules);
      for (const m of h.modules) expect(m.color).toMatch(HEX);
      const parentKey = (m: ModuleColor) => m.path.slice(0, -1).join(":");
      for (const parent of ["", ...h.modules.map((m) => m.path.join(":"))]) {
        const children = h.modules.filter((m) => parentKey(m) === parent);
        if (children.length > 1) expect(minDistance(children.map((m) => m.color))).toBeGreaterThan(0.01);
        const color = parent && h(parent.split(":").map(Number));
        for (const child of children) expect(child.color).not.toBe(color);
      }
    }
  });

  it("counts a zero flow as the smallest positive flow on its level", () => {
    const withZero: Module[] = [
      { path: [1, 1], flow: 0.5 },
      { path: [1, 2], flow: 0.2 },
      { path: [2], flow: 0 },
      { path: [2, 1], flow: 0 },
      { path: [2, 2], flow: 0 },
      { path: [3], flow: 0.1 },
    ];
    // The smallest positive flows are 0.1 on the top level and 0.2 below it
    const smallest = withZero.map(({ path, flow }) => ({ path, flow: flow || [0.1, 0.2][path.length - 1] }));
    const colors = (modules: Module[]) => hierarchy(modules).modules.map((m) => m.color);
    expect(colors(withZero)).toEqual(colors(smallest));
  });

  it("throws on flows that aren't finite and on NaN in paths", () => {
    for (const flow of [Infinity, -Infinity, NaN]) {
      expect(() => hierarchy([{ path: [1, 1], flow }, { path: [2], flow: 1 }])).toThrow(
        `Flow must be finite, got ${flow} for module [1, 1]`,
      );
    }
    expect(() => hierarchy([{ path: [1, NaN] }])).toThrow("Invalid path: [1, NaN]");
  });

  it("keeps children inside the tone's chroma range, or as colorful as their parent", () => {
    for (const tone of Object.keys(tones) as (keyof typeof tones)[]) {
      const h = hierarchy(modules, { tone });
      const [minChroma] = tones[tone].chroma;
      for (const m of h.modules) {
        const parent = h.modules.find((p) => p.path.join(":") === m.path.slice(0, -1).join(":"));
        if (!parent) continue;
        const floor = Math.min(minChroma, parseOklch(parent.color)[1]);
        expect(parseOklch(m.color)[1]).toBeGreaterThan(floor - 0.005); // hex rounding
      }
    }
  });
});
