import { useId, useState, useSyncExternalStore } from "react";
import { DIVISIONS, STATES } from "../us";
import type { Shapes } from "../usShapes";
import { Chip, delegatedHover, useHover, type Hover } from "./Hover";

let shapes: Shapes | undefined;
const listeners = new Set<() => void>();

// The atlas loads after the page; until then the map is an empty frame of the same size
import("../usShapes").then((module) => {
  shapes = module.shapes;
  listeners.forEach((listener) => listener());
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

const LEVELS = [
  { id: "divisions", label: `Divisions (${DIVISIONS.length})`, names: DIVISIONS.map((d) => d.name) },
  { id: "states", label: `States (${STATES.length})`, names: STATES.map((s) => s.name) },
] as const;

type Level = (typeof LEVELS)[number]["id"];

/**
 * The US states and DC, colored by Census division or by state; a switch sets the level.
 * Each area's index is its color's: hovering an area hovers that index, and hovered
 * areas are outlined. With hovered and onHover, the highlight is shared with the other views of the tab.
 * @param divisionColors one color per division, in the order of DIVISIONS
 * @param stateColors one color per state, in the order of STATES
 */
export function UsMap({ divisionColors, stateColors, ...shared }: { divisionColors: string[]; stateColors: string[] } & Partial<Hover>) {
  const loaded = useSyncExternalStore(subscribe, () => shapes);
  const [level, setLevel] = useState<Level>("states");
  const [own, setOwn] = useHover();
  const hovered = shared.hovered ?? own;
  const onHover = shared.onHover ?? setOwn;
  const id = useId();

  const { names } = LEVELS.find((l) => l.id === level)!;
  const colors = level === "states" ? stateColors : divisionColors;
  const areas = loaded?.[level] ?? [];
  const shown = hovered.filter((i) => i < names.length);

  return (
    <div className="us-map">
      <div className="map-level" role="radiogroup" aria-label="Map level">
        {LEVELS.map((l) => (
          <label key={l.id} className="check">
            <input type="radio" name={id} checked={level === l.id} onChange={() => setLevel(l.id)} />
            <span>{l.label}</span>
          </label>
        ))}
      </div>
      <svg viewBox="0 0 975 610" role="group" aria-label={`Map of the US ${level}`} {...delegatedHover(onHover)}>
        {areas.map((d, i) => (
          <path key={i} d={d} data-i={i} fill={colors[i]} stroke={colors[i]} tabIndex={0} aria-label={`${names[i]}, ${colors[i]}`} />
        ))}
        {loaded && <path className="us-map-borders" d={loaded.borders} />}
        {/* Hovered areas outlined on top of the borders */}
        {areas.length > 0 && shown.map((i) => <path key={i} className="us-map-hover" d={areas[i]} />)}
      </svg>
      <p className="readout" aria-live="polite">
        {shown.length > 0
          ? shown.map((i) => (
              <span key={i}>
                <Chip index={i} color={colors[i]} label={names[i]} />
                {`${names[i]}  ${colors[i]}`}
              </span>
            ))
          : "Hover or focus an area to see its name and color."}
      </p>
    </div>
  );
}
