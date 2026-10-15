import { useDeferredValue, useMemo, useState } from "react";
import { inferTone, oklch, palette, swatches, type PaletteOptions, type SchemeName, type Tone } from "@mapequation/c3";
import { defaultPaletteOptions, defaultTone, endZone, getScheme } from "@mapequation/c3/internal";
import { Check, Group, ModeLayout, ToneControls, SchemeOptions, Slider } from "../components/Controls";
import { ColorCantor } from "../components/ColorCantor";
import { PolarPlot } from "../components/PolarPlot";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { Quality } from "../components/Quality";
import { useZones } from "../components/Zones";
import { useMethod } from "../components/Method";
import { useHover } from "../components/Hover";
import { firstDifference } from "../quality";
import { callCode } from "../code";
import { schemeTone, timed, toneOption, unlessDefault } from "../util";

const muralTone = inferTone(swatches.mural);
const STRIP_SAMPLES = 64;
const METHODS = ["sequence", "farthest", "lookahead"] as const;

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
  // The tone chosen with the select or the sliders; null until one changes it
  const [custom, setCustom] = useState<Tone | null>(null);
  // Highlighted colors by index, linked across the views; apart from the memoized palettes
  const [hovered, onHover] = useHover();
  const hover = { hovered, onHover };

  const scheme = source === "circle" ? undefined : source;
  // The tone palette() uses unless told otherwise
  const base = useMemo(() => (scheme ? schemeTone(scheme) : defaultTone), [scheme]);
  const inferred = like ? muralTone : base;
  const top = custom ?? inferred;
  const method = useMethod(METHODS);
  const zones = useZones(top, method.method === "sequence");

  // The options, and the same call with the end zone toggled to compare against
  const [options, toggled] = useMemo<PaletteOptions[]>(() => {
    const common: PaletteOptions = {
      ...method.options,
      hue: scheme ?? unlessDefault(hue, defaultPaletteOptions.hue),
      offset: unlessDefault(offset, defaultPaletteOptions.offset),
      reverse: unlessDefault(reverse, defaultPaletteOptions.reverse),
      // Colors to match give the tone, unless it was changed: then a name or the fields that differ from the base
      tone: like && !custom ? swatches.mural : toneOption(top, base),
      lightnessOffset: unlessDefault(lightnessOffset, defaultPaletteOptions.lightnessOffset),
      chromaOffset: unlessDefault(chromaOffset, defaultPaletteOptions.chromaOffset),
    };
    const on = { ...common, ...zones.options };
    const off = { ...common, end: undefined };
    return zones.on ? [on, off] : [off, on];
  }, [scheme, hue, offset, reverse, like, custom, top, base, lightnessOffset, chromaOffset, method.options, zones.on, zones.options]);

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
        <p className="hint">Offset shifts the Cantor stops along the hue circle or scheme.</p>
      </Group>

      <Group legend="Method">{method.controls}</Group>

      <Group legend="Lightness and chroma">
        <Check label="Infer from the mural swatches" checked={like} onChange={(on) => { setLike(on); setCustom(null); }} />
        <ToneControls tone={top} onChange={setCustom} customLabel={custom ? "Custom" : like ? "From the mural" : "From the scheme"} />
        {custom && (
          <button type="button" className="btn" onClick={() => setCustom(null)}>
            Reset
          </button>
        )}
      </Group>

      {zones.controls}

      <Group legend="Sequence start">
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
      <CodeSnippet code={result.code} colors={result.hex} {...hover} />
    </ModeLayout>
  );
}
