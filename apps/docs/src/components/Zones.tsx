import { useMemo, useState } from "react";
import type { EndZone, Range, Tone } from "@mapequation/c3";
import { defaultEndZone, endLightness } from "@mapequation/c3/internal";
import { Check, Group, RangeSliders, Slider } from "./Controls";
import { unlessDefault } from "../util";

export type ZoneOptions = { end: EndZone | NonNullable<EndZone["lightness"]> };

/** Steepness the slider starts at when fading in, the README's example */
const FADE_STEEPNESS = 4;

/**
 * State and controls for the end zone options of palette().
 * @param top tone of the first colors, which the end zone's default lightness comes from
 * @param fade whether palette() can fade into the end zone, as only the "sequence" method can;
 *   leave out to hide the fade controls
 * @returns whether an end zone is chosen, and the options that differ from the defaults with it
 */
export function useZones(top: Tone, fade?: boolean) {
  const [direction, setDirection] = useState<"none" | "darker" | "lighter">("none");
  const on = direction !== "none";
  const [auto, setAuto] = useState(true);
  const [midpoint, setMidpoint] = useState(8);
  const [minGap, setMinGap] = useState(defaultEndZone.minGap);
  const [fadeIn, setFadeIn] = useState(false);
  const [steepness, setSteepness] = useState(FADE_STEEPNESS);
  const [custom, setCustom] = useState(false);
  // A custom lightness range, null until a slider moves
  const [range, setRange] = useState<Range | null>(null);

  // With no end zone chosen, the options are those of a darker one, to compare against
  const named = direction === "lighter" ? "lighter" : "darker";
  const base = useMemo(() => endLightness(top.lightness, named), [top, named]);
  const shown = custom && range ? range : base;

  const options = useMemo<ZoneOptions>(() => {
    // A range equal to the named one is printed by name
    const lightness = custom && String(shown) !== String(base) ? shown : named;
    const end: EndZone = {
      lightness,
      midpoint: auto ? undefined : midpoint,
      minGap: auto ? unlessDefault(minGap, defaultEndZone.minGap) : undefined,
      // Switching at once is the default
      steepness: fade && fadeIn ? steepness : undefined,
    };
    // With only the lightness, it is the shorthand
    return { end: end.midpoint === undefined && end.minGap === undefined && end.steepness === undefined ? lightness : end };
  }, [custom, shown, base, named, auto, midpoint, minGap, fade, fadeIn, steepness]);

  const controls = (
    <Group legend="Later colors" closed>
      <label className="field">
        <span>End zone</span>
        <select
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value as typeof direction);
            setRange(null);
          }}
        >
          <option value="none">None</option>
          <option value="darker">Darker</option>
          <option value="lighter">Lighter</option>
        </select>
      </label>
      <p className="hint">
        An end zone gives later colors their own lightness, so they never look like the first ones. Midpoint is how many
        colors come before it; automatic fits as many as stay Min gap apart.
      </p>
      <Check label="Automatic midpoint" checked={auto} onChange={setAuto} disabled={!on} />
      <Slider label="Midpoint" value={midpoint} onChange={setMidpoint} min={0} max={64} disabled={!on || auto} />
      <Slider label="Min gap" value={minGap} onChange={setMinGap} min={0} max={0.1} step={0.005} disabled={!on || !auto} />
      {fade !== undefined && (
        <>
          <Check label="Fade into the end zone (sequence method only)" checked={fadeIn} onChange={setFadeIn} disabled={!on || !fade} />
          <Slider
            label="Steepness"
            value={steepness}
            onChange={setSteepness}
            min={1}
            max={10}
            step={0.5}
            disabled={!on || !fade || !fadeIn}
          />
        </>
      )}
      <Check label="Set the end zone's lightness" checked={custom} onChange={setCustom} disabled={!on} />
      <RangeSliders
        label="End zone lightness"
        value={shown}
        onChange={setRange}
        min={0}
        max={1}
        step={0.01}
        disabled={!on || !custom}
      />
      {on && custom && range && (
        <button type="button" className="btn" onClick={() => setRange(null)}>
          Reset
        </button>
      )}
    </Group>
  );

  return { on, options, controls };
}
