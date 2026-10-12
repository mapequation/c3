import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  colors,
  extend,
  inferRegion,
  palette,
  presets,
  stops,
  vanDerCorput,
  type Options,
} from "../src/index.js";
import { distance, parseOklab, parseOklch } from "../src/oklab.js";

type Fixture = { name: string; n: number | number[]; opts: Options; colors?: string[]; stops?: number[][] };
const fixtures: Fixture[] = JSON.parse(
  readFileSync(new URL("./colors-v1.1.1.json", import.meta.url), "utf8"),
);

const HEX = /^#[0-9a-f]{6}$/;

function minDistance(hex: string[]) {
  const lab = hex.map(parseOklab);
  let min = Infinity;
  for (let i = 0; i < lab.length; ++i)
    for (let j = 0; j < i; ++j) min = Math.min(min, distance(lab[i]!, lab[j]!));
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

describe("colors({ vary })", () => {
  it("is consistent when n grows", () => {
    const a = colors(20, { scheme: "Sinebow", vary: true });
    const b = colors(40, { scheme: "Sinebow", vary: true });
    expect(b.slice(0, 20)).toEqual(a);
  });

  it("makes hue-cycling schemes more distinct", () => {
    const toHex = (c: string) => {
      const [r, g, b] = c.match(/\d+/g)!.map(Number);
      return "#" + [r, g, b].map((x) => x!.toString(16).padStart(2, "0")).join("");
    };
    for (const scheme of ["Sinebow", "Rainbow"] as const) {
      const plain = colors(20, { scheme }).map(toHex);
      const varied = colors(20, { scheme, vary: true }).map(toHex);
      expect(minDistance(varied)).toBeGreaterThan(minDistance(plain));
    }
  });

  it("does nothing with zero variation", () => {
    const plain = colors(10, { scheme: "Turbo" });
    const varied = colors(10, { scheme: "Turbo", vary: 0 });
    expect(varied).toEqual(plain);
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
    for (const c of palette(100, { lightness: [0.6, 0.7] })) {
      const [L] = parseOklch(c);
      expect(L).toBeGreaterThan(0.59);
      expect(L).toBeLessThan(0.71);
    }
  });

  it("keeps the first 20 colors distinct", () => {
    expect(minDistance(palette(20))).toBeGreaterThan(0.04);
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
