import { useEffect, useRef, useState } from "react";
import { oklch, swatches, tones, type Tone, type ToneName, type ToneOption, type SchemeName } from "@mapequation/c3";
import { gamutMap } from "@mapequation/c3/internal";

/** The d3 schemes the explorer offers, by kind */
export const SCHEMES: Record<string, SchemeName[]> = {
  Cyclical: ["Sinebow", "Rainbow"],
  Sequential: ["Turbo", "Viridis", "Cividis", "CubehelixDefault", "YlGnBu", "YlOrRd", "Blues", "Greys"],
  Diverging: ["Spectral", "RdYlBu", "RdYlGn", "BrBG", "PiYG", "PuOr"],
};

/** The tone palette({ hue: scheme }) uses */
export { schemeTone } from "@mapequation/c3/internal";

/** d3 schemes return rgb() or hex strings, depending on the scheme */
export function toHex(color: string) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  const m = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (!m) return color;
  return `#${m
    .slice(1, 4)
    .map((v) => Math.round(Math.min(255, Math.max(0, +v))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Split on new lines and on commas outside parentheses, so rgb(1, 2, 3) stays whole; invalid colors apart */
export function parseColors(text: string) {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const item of text.split(/\n|,(?![^(]*\))/)) {
    const color = item.trim();
    if (!color) continue;
    try {
      oklch(color);
      valid.push(color);
    } catch {
      invalid.push(color);
    }
  }
  return { valid, invalid };
}

/** Text color that reads on top of the given background */
export const inkOn = (color: string) => (oklch(color)[0] > 0.66 ? "#14181b" : "#ffffff");

export const round = (x: number, digits = 3) => +x.toFixed(digits);

/** Run fn and measure how long it took, in milliseconds */
export function timed<T>(fn: () => T): [result: T, ms: number] {
  const start = performance.now();
  const result = fn();
  return [result, performance.now() - start];
}

/** Leave out options that equal their default, so the code snippet stays short */
export const unlessDefault = <T,>(value: T, fallback: T) => (value === fallback ? undefined : value);

/** The tone fields that differ from the base tone */
export function toneDiff(tone: Tone, base: Tone): Partial<Tone> {
  const keys = Object.keys(tone) as (keyof Tone)[];
  return Object.fromEntries(keys.filter((k) => String(tone[k]) !== String(base[k])).map((k) => [k, tone[k]]));
}

/** The name of the named tone equal to this one, if any */
export const toneName = (tone: Tone) =>
  (Object.keys(tones) as ToneName[]).find((name) => Object.keys(toneDiff(tone, tones[name])).length === 0);

/**
 * The tone option that gives the tone, or undefined when the base tone already is it:
 * a name for an unmodified named tone, else the fields that differ from the base.
 */
export function toneOption(tone: Tone, base: Tone): ToneOption | undefined {
  const diff = toneDiff(tone, base);
  if (Object.keys(diff).length === 0) return undefined;
  return toneName(tone) ?? diff;
}

export const isMural = (colors: readonly string[]) =>
  colors.length === swatches.mural.length &&
  colors.every((c, i) => c.toLowerCase() === swatches.mural[i]);

/** Copy text to the clipboard and remember which key was copied for a moment */
export function useCopy() {
  const [status, setStatus] = useState<{ key: string; ok: boolean } | null>(null);
  const timer = useRef<number>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (key: string, text: string) => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      ok = false;
    }
    setStatus({ key, ok });
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(null), 1600);
  };

  const label = (key: string, idle: string) =>
    status?.key !== key ? idle : status.ok ? "Copied" : "Copy failed";

  return { copy, label, status };
}

/** The most OKLCH chroma sRGB has at a lightness and hue */
export const maxChroma = (L: number, H: number) => gamutMap([L, 0.5, H])[1];

/**
 * The most chroma sRGB has at each color's lightness and hue. A grey has no hue of its own,
 * so it takes the hue of the nearest colorful color; null when every color is grey.
 */
export function chromaLimits(lch: readonly (readonly [number, number, number])[]): number[] | null {
  const colorful = lch.flatMap(([, C], i) => (C >= 0.01 ? [i] : []));
  if (colorful.length === 0) return null;
  return lch.map(([L, C, H], i) => {
    if (C >= 0.01) return maxChroma(L, H);
    const nearest = colorful.reduce((a, b) => (Math.abs(b - i) < Math.abs(a - i) ? b : a));
    return maxChroma(L, lch[nearest][2]);
  });
}
