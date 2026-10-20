import { useDeferredValue, useMemo, useState } from "react";
import { oklch, palette, type PaletteOptions, type SchemeName, type Tone } from "@mapequation/c3";
import { defaultOffset, defaultPaletteOptions, defaultTone, endZone, getScheme } from "@mapequation/c3/internal";
import { Check, Group, ModeLayout, ToneControls, SchemeOptions, Slider } from "../components/Controls";
import { ColorCantor } from "../components/ColorCantor";
import { PolarPlot } from "../components/PolarPlot";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { Quality } from "../components/Quality";
import { useZones } from "../components/Zones";
import { useMethod } from "../components/Method";
import { useHover } from "../components/Hover";
import { UsMap } from "../components/UsMap";
import { firstDifference } from "../quality";
import { callCode } from "../code";
import { DIVISIONS, STATES } from "../us";
import { schemeTone, timed, toneOption, unlessDefault } from "../util";

const STRIP_SAMPLES = 64;
const METHODS = ["sequence", "farthest", "lookahead"] as const;

/** The hue palette() takes at each point of [0, 1], shown at a fixed lightness and chroma */
function hueStrip({ hue = defaultPaletteOptions.hue, offset = defaultOffset(hue), reverse = false }: PaletteOptions) {
  const scheme = hue === "Oklch" ? null : typeof hue === "string" ? getScheme(hue) : hue;
  return Array.from({ length: STRIP_SAMPLES }, (_, k) => {
    const p = (k + 0.5) / STRIP_SAMPLES;
    const t = (p + offset / 360) % 1;
    const h = scheme ? oklch(scheme(reverse ? 1 - t : t))[2] : (((offset + (reverse ? 360 : -360) * p) % 360) + 360) % 360;
    return `oklch(0.8 0.1 ${h.toFixed(1)})`;
  });
}

export function PaletteMode({ n, setN }: { n: number; setN: (n: number) => void }) {
  const [source, setSource] = useState<"Oklch" | SchemeName>(defaultPaletteOptions.hue);
  const [offset, setOffset] = useState(defaultOffset(defaultPaletteOptions.hue));
  const [reverse, setReverse] = useState(defaultPaletteOptions.reverse);
  const [lightnessOffset, setLightnessOffset] = useState(defaultPaletteOptions.lightnessOffset);
  const [chromaOffset, setChromaOffset] = useState(defaultPaletteOptions.chromaOffset);
  // The tone chosen with the select or the sliders; null until one changes it
  const [custom, setCustom] = useState<Tone | null>(null);
  // Highlighted colors by index, linked across the views; apart from the memoized palettes
  const [hovered, onHover] = useHover();
  const hover = { hovered, onHover };

  const scheme = source === "Oklch" ? undefined : source;
  // The tone palette() uses unless told otherwise
  const base = useMemo(() => (scheme ? schemeTone(scheme) : defaultTone), [scheme]);
  const top = custom ?? base;
  const method = useMethod(METHODS);
  const zones = useZones(top, method.method === "sequence");

  // The options, and the same call with the end zone toggled to compare against
  const [options, toggled] = useMemo<PaletteOptions[]>(() => {
    const common: PaletteOptions = {
      ...method.options,
      hue: unlessDefault(source, defaultPaletteOptions.hue),
      offset: unlessDefault(offset, defaultOffset(source)),
      reverse: unlessDefault(reverse, defaultPaletteOptions.reverse),
      // A name, or the fields that differ from the base
      tone: toneOption(top, base),
      lightnessOffset: unlessDefault(lightnessOffset, defaultPaletteOptions.lightnessOffset),
      chromaOffset: unlessDefault(chromaOffset, defaultPaletteOptions.chromaOffset),
    };
    const on = { ...common, ...zones.options };
    const off = { ...common, end: undefined };
    return zones.on ? [on, off] : [off, on];
  }, [source, offset, reverse, top, base, lightnessOffset, chromaOffset, method.options, zones.on, zones.options]);

  const deferred = useDeferredValue(useMemo(() => ({ n, options, toggled }), [n, options, toggled]));
  const result = useMemo(() => {
    const { n, options, toggled } = deferred;
    const [hex, ms] = timed(() => palette(n, options));
    const [other, otherMs] = timed(() => palette(n, toggled));
    const on = Boolean(options.end);
    return {
      hex,
      ms,
      label: on ? "end zone" : "no end zone",
      comparison: { label: on ? "no end zone" : "end zone", colors: other, ms: otherMs },
      // Mark where the end zone starts: where the same call with a hard switch differs.
      // Only the sequence method fades; the others switch at once.
      endZone: on ? firstDifference(options.method ? hex : palette(n, { ...options, end: { ...endZone(options.end), steepness: Infinity } }), other) : -1,
      strip: hueStrip(options),
      inOrder: !options.method,
      code: callCode("palette", n, options),
      // The same palette, one color per area of the map
      map: { divisionColors: palette(DIVISIONS.length, options), stateColors: palette(STATES.length, options) },
    };
  }, [deferred]);

  const controls = (
    <>
      <Group legend="Hue">
        <label className="field">
          <span>Hue source</span>
          <select
            value={source}
            onChange={(e) => {
              const next = e.target.value as typeof source;
              setSource(next);
              setOffset(defaultOffset(next));
            }}
          >
            <option value="Oklch">Oklch (OKLCH hue circle)</option>
            <SchemeOptions />
          </select>
        </label>
        <Slider label="Offset" value={offset} onChange={setOffset} min={0} max={360} />
        <Check label="Reverse direction" checked={reverse} onChange={setReverse} />
        <p className="hint">Offset is where the first color sits, in degrees: its hue on the OKLCH hue circle. On a scheme, 360 is the whole scheme.</p>
      </Group>

      <Group legend="Method">{method.controls}</Group>

      <Group legend="Lightness and chroma">
        <ToneControls tone={top} onChange={setCustom} autoLabel={scheme ? "Auto (from the scheme)" : "Auto (default)"} auto={!custom} />
      </Group>

      {zones.controls}

      <Group legend="Sequence start" closed>
        <Slider label="Lightness offset" value={lightnessOffset} onChange={setLightnessOffset} min={0} max={40} />
        <Slider label="Chroma offset" value={chromaOffset} onChange={setChromaOffset} min={0} max={40} />
        <p className="hint">Where lightness and chroma start in their sequences. Changes the colors, not how evenly they spread.</p>
      </Group>
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      <div className="figures">
        <figure>
          <ColorCantor colors={result.hex} strip={result.strip} {...hover} />
          <figcaption>
            The first 16 Cantor stops, one row each. Each color takes the hue behind its stop, from the{" "}
            {scheme ? "scheme" : "hue circle"} shifted by Offset. Lightness and chroma come from their own sequences, within
            the tone.
            {!result.inOrder && " With this method, colors are taken out of order, so a dot can differ from the hue behind it."}
          </figcaption>
        </figure>
        <figure>
          <PolarPlot colors={result.hex} tone={top} {...hover} />
          <figcaption>
            Colors by hue (angle) and chroma (distance from the center). The shaded band is the chroma each hue can get. It
            is narrower for hues far from the warm hue; Tilt sets how much.
          </figcaption>
        </figure>
      </div>
      <Swatches colors={result.hex} {...hover} />
      <Quality colors={result.hex} ms={result.ms} label={result.label} comparison={result.comparison} endZone={result.endZone} {...hover} />
      <figure className="wide">
        <UsMap {...result.map} {...hover} />
        <figcaption>
          The first colors on a map of the US: one per Census division, or one per state and DC, in division order. The
          switch sets the level.
        </figcaption>
      </figure>
      <CodeSnippet code={result.code} colors={result.hex} {...hover} />
    </ModeLayout>
  );
}
