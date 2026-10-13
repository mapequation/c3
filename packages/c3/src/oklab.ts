import { rgb } from "d3-color";

// OKLab and OKLCH conversions for sRGB colors.
// https://bottosson.github.io/posts/oklab/

export type Lab = [L: number, a: number, b: number];
export type Lch = [L: number, C: number, H: number];
type RGB = [r: number, g: number, b: number];

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const fromLinear = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

function srgbToOklab([R, G, B]: RGB): Lab {
  const r = toLinear(R);
  const g = toLinear(G);
  const b = toLinear(B);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinearSrgb([L, a, b]: Lab): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function lchToLab([L, C, H]: Lch): Lab {
  const h = (H * Math.PI) / 180;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

export function labToLch([L, a, b]: Lab): Lch {
  const H = (Math.atan2(b, a) * 180) / Math.PI;
  return [L, Math.hypot(a, b), H < 0 ? H + 360 : H];
}

/**
 * Parse any CSS color string to OKLab.
 * @throws if the color can't be parsed
 */
export function parseOklab(color: string): Lab {
  const c = rgb(color);
  if (Number.isNaN(c.r) || Number.isNaN(c.g) || Number.isNaN(c.b)) {
    throw new Error(`Invalid color: ${color}`);
  }
  return srgbToOklab([c.r / 255, c.g / 255, c.b / 255]);
}

export const parseOklch = (color: string): Lch => labToLch(parseOklab(color));

const EPS = 1e-6;

export function inGamut(lab: Lab) {
  return oklabToLinearSrgb(lab).every((c) => c >= -EPS && c <= 1 + EPS);
}

/**
 * Reduce chroma (keeping lightness and hue) until the color fits in sRGB.
 */
export function gamutMap([L, C, H]: Lch): Lch {
  if (inGamut(lchToLab([L, C, H]))) return [L, C, H];
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 16; ++i) {
    const mid = (lo + hi) / 2;
    if (inGamut(lchToLab([L, mid, H]))) lo = mid;
    else hi = mid;
  }
  return [L, lo, H];
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const toByte = (c: number) => Math.round(clamp01(fromLinear(clamp01(c))) * 255);

export function labToHex(lab: Lab) {
  return (
    "#" +
    oklabToLinearSrgb(lab)
      .map((c) => toByte(c).toString(16).padStart(2, "0"))
      .join("")
  );
}

export const lchToHex = (lch: Lch) => labToHex(lchToLab(gamutMap(lch)));

export function labDistance(a: Lab, b: Lab) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Euclidean distance in OKLab between two CSS colors.
 * About 0.02 is just noticeable.
 */
export function distance(a: string, b: string) {
  return labDistance(parseOklab(a), parseOklab(b));
}
