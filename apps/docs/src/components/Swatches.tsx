import { memo } from "react";
import { oklch } from "@mapequation/c3";
import { inkOn, round, useCopy } from "../util";
import { delegatedHover, indexAt, useHover, type Hover } from "./Hover";

// The first colors are the ones most people use, so show them larger.
// Each tier has twice the columns of the one above, so the grids line up,
// and holds whole rows: one large, two medium.
const TIERS = [
  { size: "lg", from: 0, to: 8 },
  { size: "md", from: 8, to: 40 },
  { size: "sm", from: 40, to: Infinity },
];

// Memoized, so hovering only re-renders the swatches whose highlight changes and the readout
const Swatch = memo(function Swatch({ i, color, seed, large, hovered }: { i: number; color: string; seed: boolean; large: boolean; hovered: boolean }) {
  return (
    <button
      type="button"
      className="swatch"
      data-i={i}
      data-seed={seed || undefined}
      data-hover={hovered || undefined}
      style={{ background: color, color: inkOn(color) }}
      title={color}
      aria-label={`Copy color ${i + 1}, ${color}`}
    >
      {large && <span>{color}</span>}
    </button>
  );
});

/**
 * Hex colors as a grid of buttons; hover or focus to inspect, click to copy.
 * With hovered and onHover, the highlight is shared with the other views of the tab.
 */
export function Swatches({ colors, seeds = 0, ...shared }: { colors: string[]; seeds?: number } & Partial<Hover>) {
  const [own, setOwn] = useHover();
  const hovered = shared.hovered ?? own;
  const onHover = shared.onHover ?? setOwn;
  const { copy, status } = useCopy();

  const shown = hovered.filter((i) => i < colors.length);
  const kind = (i: number) => (i < seeds ? " (seed)" : "");
  let readout = "Hover or focus a swatch to inspect it, click to copy its hex value.";
  if (status) {
    readout = status.ok ? `Copied ${status.key}` : "Could not access the clipboard";
  } else if (shown.length === 1) {
    const [i] = shown;
    const [L, C, H] = oklch(colors[i]);
    readout = `${i + 1}${kind(i)}  ${colors[i]}  oklch(${round(L)} ${round(C)} ${C < 1e-4 ? 0 : Math.round(H)})`;
  } else if (shown.length > 1) {
    readout = shown.map((i) => `${i + 1}${kind(i)}  ${colors[i]}`).join("    ");
  }

  return (
    <div
      className="swatch-panel"
      {...delegatedHover(onHover)}
      onClick={(e) => {
        const i = indexAt(e);
        if (i !== null) copy(colors[i], colors[i]);
      }}
    >
      {TIERS.filter(({ from }) => colors.length > from).map(({ size, from, to }) => (
        <div key={size} className={`swatches ${size}`}>
          {colors.slice(from, to).map((color, j) => {
            const i = from + j;
            return <Swatch key={i} i={i} color={color} seed={i < seeds} large={size === "lg"} hovered={hovered.includes(i)} />;
          })}
        </div>
      ))}
      <p className="readout" aria-live="polite">
        {readout}
      </p>
    </div>
  );
}
