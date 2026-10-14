import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  colors,
  defaultEnd,
  defaultRegion,
  distance,
  extend,
  hierarchy,
  inferRegion,
  palette,
  presets,
  stops,
  vanDerCorput,
  type Options,
} from "../src/index.js";
import { labDistance, parseOklab, parseOklch } from "../src/oklab.js";

type Fixture = { name: string; n: number | number[]; opts: Options; colors?: string[]; stops?: number[][] };
const fixtures: Fixture[] = JSON.parse(
  readFileSync(new URL("./colors-v1.1.1.json", import.meta.url), "utf8"),
);
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

describe("colors() is unchanged from v1.1.1", () => {
  for (const f of fixtures) {
    it(f.name, () => {
      if (f.stops) {
        expect(stops(f.n).map(({ start, end }) => [start, end])).toEqual(f.stops);
      } else {
        expect(colors(f.n, f.opts)).toEqual(f.colors);
      }
    });
  }
});

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
    for (const c of palette(100, { lightness: [0.6, 0.7], end: false })) {
      const [L] = parseOklch(c);
      expect(L).toBeGreaterThan(0.59);
      expect(L).toBeLessThan(0.71);
    }
  });

  it("keeps the first 20 colors distinct", () => {
    expect(minDistance(palette(20, { steepness: Infinity }))).toBeGreaterThan(0.04);
  });

  it("changes the first color with hue but not the spacing", () => {
    const a = palette(20, { hue: 0 });
    const b = palette(20, { hue: 180 });
    expect(a[0]).not.toEqual(b[0]);
    expect(minDistance(b)).toBeGreaterThan(0.03);
  });

  it("accepts weights", () => {
    expect(palette([1, 2, 3])).toHaveLength(3);
  });
});

describe("palette() without zones", () => {
  it("is unchanged from before zones were added", () => {
    expect(palette(50, { end: false })).toEqual(beforeZones.default);
    expect(palette(30, { hue: 40, end: false })).toEqual(beforeZones.hue40);
    expect(palette(30, { like: presets.mural, end: false })).toEqual(beforeZones.likeMural);
    expect(palette([5, 1, 3, 2, 8], { end: false })).toEqual(beforeZones.weights);
  });
});

describe("palette() zones", () => {
  const end = { lightness: [0.9, 0.95] as [number, number] };
  const lightness = (colors: string[]) => colors.map((c) => parseOklch(c)[0]);

  it("switches to the end region at the midpoint", () => {
    const L = lightness(palette(40, { end, midpoint: 10, steepness: Infinity }));
    for (const l of L.slice(0, 10)) expect(l).toBeLessThan(0.84);
    for (const l of L.slice(10)) expect(l).toBeGreaterThan(0.89);
  });

  it("puts as many colors as fit minGap apart in the top zone", () => {
    const colors = palette(100, { end, steepness: Infinity });
    const m = lightness(colors).findIndex((l) => l > 0.89);
    expect(m).toBeGreaterThan(10);
    // hex rounding can shrink a distance slightly
    expect(minDistance(colors.slice(0, m))).toBeGreaterThan(0.038);
    expect(minDistance(palette(m + 1, { end: false }))).toBeLessThan(0.04);
  });

  it("is consistent when n grows, also with an automatic midpoint and a fade", () => {
    for (const n of [5, 15, 21, 22, 23, 40]) {
      expect(palette(100).slice(0, n)).toEqual(palette(n));
      expect(palette(100, { hue: "Turbo" }).slice(0, n)).toEqual(palette(n, { hue: "Turbo" }));
    }
  });

  it("fades by default", () => {
    const L = lightness(palette(60, { end }));
    expect(L.slice(10, 40).some((l) => l > 0.84 && l < 0.9)).toBe(true);
  });

  it("keeps the top zone apart from later colors", () => {
    const colors = palette(250, { steepness: Infinity });
    const m = lightness(colors).findIndex((l) => l > 0.85);
    const top = colors.slice(0, m).map(parseOklab);
    const rest = colors.slice(m).map(parseOklab);
    const gap = Math.min(...top.flatMap((a) => rest.map((b) => labDistance(a, b))));
    expect(gap).toBeGreaterThan(0.03);
  });

  it("fades smoothly with a finite steepness", () => {
    const L = lightness(palette(200, { end, midpoint: 10, steepness: 3 }));
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(L.slice(0, 5))).toBeLessThan(0.8);
    expect(mean(L.slice(100))).toBeGreaterThan(0.88);
    expect(L.slice(8, 30).some((l) => l > 0.84 && l < 0.9)).toBe(true);
  });
});

describe("defaultEnd()", () => {
  it("is lighter when there is room above the top region", () => {
    expect(defaultEnd(defaultRegion).lightness[0]).toBeGreaterThan(defaultRegion.lightness[1]);
  });

  it("is darker when the top region is already light", () => {
    const end = defaultEnd({ ...defaultRegion, lightness: [0.5, 0.9] });
    expect(end.lightness[1]).toBeLessThan(0.5);
  });

  it("is greyer when there is no room above or below", () => {
    const end = defaultEnd({ ...defaultRegion, lightness: [0.3, 0.95], chroma: [0.1, 0.2] });
    expect(end.lightness).toEqual([0.3, 0.95]);
    expect(end.chroma[1]).toBeLessThan(0.1);
  });
});

describe("palette({ hue: scheme })", () => {
  const circular = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

  it("takes hues from the scheme at the Cantor stops", () => {
    const fromScheme = colors(20, { scheme: "Sinebow" });
    const fromPalette = palette(20, { hue: "Sinebow", end: false });
    fromPalette.forEach((c, i) => {
      expect(circular(parseOklch(c)[2], parseOklch(fromScheme[i]!)[2])).toBeLessThan(6);
    });
  });

  it("is more distinct than colors() for the same scheme", () => {
    for (const scheme of ["Sinebow", "Turbo", "Spectral"] as const) {
      expect(minDistance(palette(20, { hue: scheme }))).toBeGreaterThan(minDistance(colors(20, { scheme })));
    }
  });

  it("accepts an interpolator and throws on unknown names", () => {
    expect(palette(5, { hue: (t: number) => `hsl(${t * 360}, 80%, 50%)` })).toHaveLength(5);
    // @ts-expect-error unknown scheme
    expect(() => palette(5, { hue: "Nope" })).toThrow(/Unknown color scheme/);
  });
});

describe("extend()", () => {
  const seeds = presets.mural;

  for (const method of ["greedy", "halton"] as const) {
    describe(method, () => {
      it("keeps the seeds first", () => {
        expect(extend(seeds, 20, { method }).slice(0, 5)).toEqual([...seeds]);
      });

      it("is deterministic and consistent when n grows", () => {
        const a = extend(seeds, 25, { method });
        expect(extend(seeds, 25, { method })).toEqual(a);
        expect(extend(seeds, 50, { method }).slice(0, 25)).toEqual(a);
      });

      it("adds distinct colors", () => {
        const p = extend(seeds, 20, { method });
        expect(p).toHaveLength(20);
        for (const c of p) expect(c).toMatch(HEX);
        expect(minDistance(p)).toBeGreaterThan(0.04);
      });
    });
  }

  it("truncates when n is smaller than the number of seeds", () => {
    expect(extend(seeds, 3)).toEqual(seeds.slice(0, 3));
    expect(extend(seeds, 0)).toEqual([]);
  });

  it("works without seeds", () => {
    expect(extend([], 10)).toHaveLength(10);
  });

  it("accepts any CSS color", () => {
    expect(extend(["red", "rgb(0, 0, 255)"], 4).slice(0, 2)).toEqual(["#ff0000", "#0000ff"]);
  });

  it("throws on invalid colors", () => {
    expect(() => extend(["not a color"], 4)).toThrow(/Invalid color/);
  });
});

describe("extend() zones", () => {
  const seeds = presets.mural;
  const end = { lightness: [0.9, 0.95] as [number, number] };
  const lightness = (colors: string[]) => colors.map((c) => parseOklch(c)[0]);

  for (const method of ["greedy", "halton"] as const) {
    it(`${method}: fills the top zone minGap apart, then the end region`, () => {
      const colors = extend(seeds, 120, { method, end });
      const L = lightness(colors);
      const m = L.findIndex((l, i) => i >= seeds.length && l > 0.89);
      expect(m).toBeGreaterThan(seeds.length + 5);
      for (const l of L.slice(m)) expect(l).toBeGreaterThan(0.89);
      expect(minDistance(colors.slice(seeds.length, m))).toBeGreaterThan(0.038);
      expect(extend(seeds, 60, { method, end })).toEqual(colors.slice(0, 60));
    });
  }

  it("switches at a fixed midpoint", () => {
    const L = lightness(extend(seeds, 30, { end, midpoint: 12 }));
    for (const l of L.slice(5, 12)) expect(l).toBeLessThan(0.84);
    for (const l of L.slice(12)) expect(l).toBeGreaterThan(0.89);
  });
});

describe("inferRegion()", () => {
  it("finds the mural's lightness and chroma ranges and warm hue", () => {
    const r = inferRegion(presets.mural);
    expect(r.lightness[0]).toBeCloseTo(0.648, 2);
    expect(r.lightness[1]).toBeCloseTo(0.818, 2);
    expect(r.chroma[0]).toBeCloseTo(0.029, 2);
    expect(r.chroma[1]).toBeCloseTo(0.119, 2);
    expect(r.warmHue).toBeGreaterThan(20);
    expect(r.warmHue).toBeLessThan(70);
    expect(r.tilt).toBeGreaterThan(0);
  });

  it("widens a single color to a usable range", () => {
    const r = inferRegion(["#808080"]);
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
    const w = Array.from({ length: n }, (_, i) => 1 / (i + 1) ** 1.3);
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
});
