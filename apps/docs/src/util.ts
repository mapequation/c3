import { useEffect, useRef, useState } from "react";
import { oklch, swatches, tones, type Tone, type ToneName, type ToneOption, type SchemeName } from "@mapequation/c3";

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
