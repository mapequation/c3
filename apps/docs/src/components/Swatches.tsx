import { useMemo, useState, type SyntheticEvent } from "react";
import { oklch } from "@mapequation/c3";
import { inkOn, round, useCopy } from "../util";

// The first colors are the ones most people use, so show them larger.
// Each tier has twice the columns of the one above, so the grids line up,
// and holds whole rows: one large, two medium.
const TIERS = [
  { size: "lg", from: 0, to: 8 },
  { size: "md", from: 8, to: 40 },
  { size: "sm", from: 40, to: Infinity },
];

const indexOf = (e: SyntheticEvent) => {
  const i = (e.target as HTMLElement).closest<HTMLElement>("[data-i]")?.dataset.i;
  return i === undefined ? null : +i;
};

/** Hex colors as a grid of buttons; hover or focus to inspect, click to copy */
export function Swatches({ colors, seeds = 0 }: { colors: string[]; seeds?: number }) {
  const [active, setActive] = useState<number | null>(null);
  const { copy, status } = useCopy();

  // Rendered once per colors, so hovering only re-renders the readout
  const grid = useMemo(
    () =>
      TIERS.filter(({ from }) => colors.length > from).map(({ size, from, to }) => (
        <div key={size} className={`swatches ${size}`}>
          {colors.slice(from, to).map((color, j) => {
            const i = from + j;
            return (
              <button
                key={i}
                type="button"
                className="swatch"
                data-i={i}
                data-seed={i < seeds || undefined}
                style={{ background: color, color: inkOn(color) }}
                title={color}
                aria-label={`Copy color ${i + 1}, ${color}`}
              >
                {size === "lg" && <span>{color}</span>}
              </button>
            );
          })}
        </div>
      )),
    [colors, seeds],
  );

  const shown = active !== null && active < colors.length ? active : null;
  let readout = "Hover or focus a swatch to inspect it, click to copy its hex value.";
  if (status) {
    readout = status.ok ? `Copied ${status.key}` : "Could not access the clipboard";
  } else if (shown !== null) {
    const [L, C, H] = oklch(colors[shown]);
    const kind = shown < seeds ? " (seed)" : "";
    readout = `${shown + 1}${kind}  ${colors[shown]}  oklch(${round(L)} ${round(C)} ${C < 1e-4 ? 0 : Math.round(H)})`;
  }

  return (
    <div
      className="swatch-panel"
      onPointerOver={(e) => setActive(indexOf(e))}
      onPointerLeave={() => setActive(null)}
      onFocus={(e) => setActive(indexOf(e))}
      onBlur={() => setActive(null)}
      onClick={(e) => {
        const i = indexOf(e);
        if (i !== null) copy(colors[i], colors[i]);
      }}
    >
      {grid}
      <p className="readout" aria-live="polite">
        {readout}
      </p>
    </div>
  );
}
