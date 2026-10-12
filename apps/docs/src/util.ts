import { useEffect, useRef, useState } from "react";
import { oklch, presets, type Region } from "@mapequation/c3";

/** colors() returns rgb() or hex strings, depending on the scheme */
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

/** Leave out options that equal their default, so the code snippet stays short */
export const unlessDefault = <T,>(value: T, fallback: T) => (value === fallback ? undefined : value);

/** The region keys that differ from the base region */
export function regionDiff(region: Region, base: Region): Partial<Region> {
  const keys = Object.keys(region) as (keyof Region)[];
  return Object.fromEntries(
    keys.filter((k) => String(region[k]) !== String(base[k])).map((k) => [k, region[k]]),
  );
}

export const isMural = (colors: readonly string[]) =>
  colors.length === presets.mural.length &&
  colors.every((c, i) => c.toLowerCase() === presets.mural[i]);

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
