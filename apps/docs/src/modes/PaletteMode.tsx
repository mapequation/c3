import { useDeferredValue, useMemo, useState } from "react";
import {
  defaultPaletteOptions,
  defaultRegion,
  getScheme,
  inferRegion,
  oklch,
  palette,
  presets,
  type PaletteOptions,
  type Region,
  type SchemeName,
} from "@mapequation/c3";
import { Check, Group, ModeLayout, RegionControls, SchemeOptions, Slider } from "../components/Controls";
import { ColorCantor } from "../components/ColorCantor";
import { PolarPlot } from "../components/PolarPlot";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { Quality } from "../components/Quality";
import { useZones } from "../components/Zones";
import { firstDifference } from "../quality";
import { callCode } from "../code";
import { regionDiff, schemeRegion, timed, unlessDefault } from "../util";

const muralRegion = inferRegion(presets.mural);
const STRIP_SAMPLES = 64;

/** The hue palette() takes at each point of [0, 1], shown at a fixed lightness and chroma */
function hueStrip({ hue = defaultPaletteOptions.hue, offset = 0, reverse = false }: PaletteOptions) {
  const scheme = typeof hue === "number" ? null : typeof hue === "string" ? getScheme(hue) : hue;
  return Array.from({ length: STRIP_SAMPLES }, (_, k) => {
    const t = ((k + 0.5) / STRIP_SAMPLES + offset) % 1;
    const h = scheme ? oklch(scheme(reverse ? 1 - t : t))[2] : (((hue as number) + (reverse ? 360 : -360) * t) % 360 + 360) % 360;
    return `oklch(0.8 0.1 ${h.toFixed(1)})`;
  });
}

export function PaletteMode({ n, setN }: { n: number; setN: (n: number) => void }) {
  const [source, setSource] = useState<"circle" | SchemeName>("circle");
  const [hue, setHue] = useState(defaultPaletteOptions.hue);
  const [offset, setOffset] = useState(defaultPaletteOptions.offset);
  const [reverse, setReverse] = useState(defaultPaletteOptions.reverse);
  const [lightnessOffset, setLightnessOffset] = useState(defaultPaletteOptions.lightnessOffset);
  const [chromaOffset, setChromaOffset] = useState(defaultPaletteOptions.chromaOffset);
  const [like, setLike] = useState(false);
  const [override, setOverride] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);

  const scheme = source === "circle" ? undefined : source;
  // The region palette() uses unless told otherwise
  const inferred = useMemo(() => (like ? muralRegion : scheme ? schemeRegion(scheme) : defaultRegion), [like, scheme]);
  const top = override && region ? region : inferred;
  const zones = useZones(top, true);

  // The options, and the same call with zones toggled to compare against
  const [options, toggled] = useMemo<PaletteOptions[]>(() => {
    const base: PaletteOptions = {
      hue: scheme ?? unlessDefault(hue, defaultPaletteOptions.hue),
      offset: unlessDefault(offset, defaultPaletteOptions.offset),
      reverse: unlessDefault(reverse, defaultPaletteOptions.reverse),
      like: like ? presets.mural : undefined,
      ...regionDiff(top, inferred),
      lightnessOffset: unlessDefault(lightnessOffset, defaultPaletteOptions.lightnessOffset),
      chromaOffset: unlessDefault(chromaOffset, defaultPaletteOptions.chromaOffset),
    };
    const on = { ...base, ...zones.options };
    const off = { ...base, end: false as const };
    return zones.on ? [on, off] : [off, on];
  }, [scheme, hue, offset, reverse, like, top, inferred, lightnessOffset, chromaOffset, zones.on, zones.options]);

  const deferred = useDeferredValue(useMemo(() => ({ n, options, toggled }), [n, options, toggled]));
  const result = useMemo(() => {
    const { n, options, toggled } = deferred;
    const [hex, ms] = timed(() => palette(n, options));
    const [other, otherMs] = timed(() => palette(n, toggled));
    const on = options.end !== false;
    return {
      hex,
      ms,
      label: on ? "zones" : "no zones",
      comparison: { label: on ? "no zones" : "zones", colors: other, ms: otherMs },
      // With a fade, mark where it starts: where the same call with a hard switch differs
      endZone: on ? firstDifference(palette(n, { ...options, steepness: Infinity }), other) : -1,
      strip: hueStrip(options),
      code: callCode("palette", n, options),
    };
  }, [deferred]);

  const controls = (
    <>
      <Group legend="Hue">
        <label className="field">
          <span>Hue source</span>
          <select value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
            <option value="circle">OKLCH hue circle</option>
            <SchemeOptions />
          </select>
        </label>
        <Slider label="First hue" value={hue} onChange={setHue} min={0} max={360} disabled={!!scheme} />
        <Slider label="Offset" value={offset} onChange={setOffset} min={0} max={1} step={0.01} />
        <Check label="Reverse direction" checked={reverse} onChange={setReverse} />
      </Group>

      <Group legend="Region">
        <Check label="Infer from the mural preset" checked={like} onChange={setLike} />
        <Check
          label={like || scheme ? `Override the region inferred from ${like ? "the mural" : scheme}` : "Override the default region"}
          checked={override}
          onChange={(checked) => {
            setOverride(checked);
            if (checked) setRegion(inferred);
          }}
        />
        <RegionControls region={top} onChange={setRegion} disabled={!override} />
        {override && (
          <button type="button" className="btn" onClick={() => setRegion(inferred)}>
            Reset region
          </button>
        )}
      </Group>

      {zones.controls}

      <Group legend="Sequence start">
        <Slider label="Lightness offset" value={lightnessOffset} onChange={setLightnessOffset} min={0} max={40} />
        <Slider label="Chroma offset" value={chromaOffset} onChange={setChromaOffset} min={0} max={40} />
      </Group>
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      <div className="figures">
        <figure>
          <ColorCantor colors={result.hex} strip={result.strip} />
          <figcaption>
            How the first 16 stops split the interval. Each stop takes the hue behind it, from the{" "}
            {scheme ? "scheme" : "hue circle"} shifted by the offset; lightness and chroma come from the region.
          </figcaption>
        </figure>
        <figure>
          <PolarPlot colors={result.hex} region={top} />
          <figcaption>
            Hue as angle, chroma as distance from the center (OKLCH). The shaded band is the chroma the top region allows
            at each hue; it narrows away from the warm hue by the tilt.
          </figcaption>
        </figure>
      </div>
      <Swatches colors={result.hex} />
      <Quality colors={result.hex} ms={result.ms} label={result.label} comparison={result.comparison} endZone={result.endZone} />
      <CodeSnippet code={result.code} colors={result.hex} />
    </ModeLayout>
  );
}
