import { useMemo, useState } from "react";
import { defaultEnd, defaultPaletteOptions, type Region, type Zones } from "@mapequation/c3";
import { Check, Group, RegionControls, Slider } from "./Controls";
import { regionDiff, unlessDefault } from "../util";

export type ZoneOptions = Zones & { steepness?: number };

/**
 * State and controls for the zone options of palette() and extend().
 * @param top region of the first colors, which the default end region is made from
 * @param fade offer a gradual switch with a steepness, as palette() does
 * @returns whether zones are on, and the options that differ from the defaults when they are
 */
export function useZones(top: Region, fade = false) {
  const [on, setOn] = useState(true);
  const [auto, setAuto] = useState(true);
  const [midpoint, setMidpoint] = useState(8);
  const [minGap, setMinGap] = useState(defaultPaletteOptions.minGap);
  const [hard, setHard] = useState(!Number.isFinite(defaultPaletteOptions.steepness));
  const [steepness, setSteepness] = useState(Number.isFinite(defaultPaletteOptions.steepness) ? defaultPaletteOptions.steepness : 4);
  const [override, setOverride] = useState(false);
  const [end, setEnd] = useState<Region | null>(null);

  const base = useMemo(() => defaultEnd(top), [top]);
  const shownEnd = override && end ? end : base;

  const options = useMemo<ZoneOptions>(() => {
    const diff = regionDiff(shownEnd, base);
    return {
      end: Object.keys(diff).length > 0 ? diff : undefined,
      midpoint: auto ? undefined : midpoint,
      minGap: auto ? unlessDefault(minGap, defaultPaletteOptions.minGap) : undefined,
      steepness: !fade ? undefined : hard ? Infinity : unlessDefault(steepness, defaultPaletteOptions.steepness),
    };
  }, [shownEnd, base, auto, midpoint, minGap, fade, hard, steepness]);

  const controls = (
    <Group legend="Later colors">
      <Check label="Move later colors to an end region" checked={on} onChange={setOn} />
      <Check label="Automatic midpoint" checked={auto} onChange={setAuto} disabled={!on} />
      <Slider label="Midpoint" value={midpoint} onChange={setMidpoint} min={0} max={64} disabled={!on || auto} />
      <Slider label="Min gap" value={minGap} onChange={setMinGap} min={0} max={0.1} step={0.005} disabled={!on || !auto} />
      {fade && (
        <>
          <Check label="Hard switch" checked={hard} onChange={setHard} disabled={!on} />
          <Slider label="Steepness" value={steepness} onChange={setSteepness} min={1} max={10} step={0.5} disabled={!on || hard} />
        </>
      )}
      <Check
        label="Override the end region"
        checked={override}
        disabled={!on}
        onChange={(checked) => {
          setOverride(checked);
          if (checked) setEnd(base);
        }}
      />
      <RegionControls region={shownEnd} onChange={setEnd} disabled={!on || !override} />
      {on && override && (
        <button type="button" className="btn" onClick={() => setEnd(base)}>
          Reset to lighter top region
        </button>
      )}
    </Group>
  );

  return { on, options, controls };
}
