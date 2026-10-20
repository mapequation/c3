import { Fragment, useDeferredValue, useId, useMemo, useState } from "react";
import { inferTone, oklch, palette, swatches, type PaletteOptions, type Tone } from "@mapequation/c3";
import { defaultPaletteOptions, defaultTone } from "@mapequation/c3/internal";
import { Group, ModeLayout, ToneControls, Slider } from "../components/Controls";
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
import { isMural, timed, toneOption, unlessDefault } from "../util";

const MURAL = swatches.mural.join("\n");
const METHODS = ["farthest", "lookahead"] as const;

/** Split on new lines and on commas outside parentheses, so rgb(1, 2, 3) stays whole */
function parseSeeds(text: string) {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const item of text.split(/\n|,(?![^(]*\))/)) {
    const color = item.trim();
    if (!color) continue;
    try {
      oklch(color);
      valid.push(color);
    } catch {
      invalid.push(color);
    }
  }
  return { valid: isMural(valid) ? swatches.mural : valid, invalid };
}

export function SeedsMode({ n, setN }: { n: number; setN: (n: number) => void }) {
  const [text, setText] = useState(MURAL);
  const method = useMethod(METHODS);
  const [offset, setOffset] = useState(defaultPaletteOptions.offset);
  // The tone chosen with the select or the sliders; null until one changes it
  const [custom, setCustom] = useState<Tone | null>(null);
  const errorId = useId();
  // Highlighted colors by index, linked across the views; apart from the memoized palettes
  const [hovered, onHover] = useHover();
  const hover = { hovered, onHover };

  const { valid: seeds, invalid } = useMemo(() => parseSeeds(text), [text]);
  const inferred = useMemo(() => inferTone(seeds), [seeds]);
  const shownTone = custom ?? inferred;
  const zones = useZones(shownTone);

  const options = useMemo<PaletteOptions>(
    () => ({
      seeds: seeds.length > 0 ? seeds : undefined,
      ...method.options,
      // Without seeds the default method is "sequence"
      method: seeds.length > 0 ? method.options.method : method.method,
      offset: unlessDefault(offset, defaultPaletteOptions.offset),
      // The seeds give the tone, unless it was changed
      tone: seeds.length > 0 ? toneOption(shownTone, inferred) : toneOption(shownTone, defaultTone),
      ...(zones.on && zones.options),
    }),
    [seeds, method.options, method.method, offset, shownTone, inferred, zones.on, zones.options],
  );

  const deferred = useDeferredValue(useMemo(() => ({ n, options }), [n, options]));
  const result = useMemo(() => {
    const { n, options } = deferred;
    const [hex, ms] = timed(() => palette(n, options));
    const method = options.method ?? METHODS[0];
    // Where the end zone starts: the first color that differs without it
    const endZone = options.end ? firstDifference(hex, palette(n, { ...options, end: false })) : -1;
    // The same palette, one color per area of the map; the seeds come first
    const map = { divisionColors: palette(DIVISIONS.length, options), stateColors: palette(STATES.length, options) };
    return { hex, ms, method, endZone, map, code: callCode("palette", n, options), seeds: options.seeds?.length ?? 0 };
  }, [deferred]);

  // The same seeds and options with the other method
  const comparison = useMemo(() => {
    const { n, options } = deferred;
    const method = (options.method ?? METHODS[0]) === "farthest" ? "lookahead" : "farthest";
    const [colors, ms] = timed(() => palette(n, { ...options, method }));
    return { label: method, colors, ms };
  }, [deferred]);

  const controls = (
    <>
      <Group legend="Seed colors">
        <div className="field">
          <div className="field-head">
            <label htmlFor={`${errorId}-seeds`}>One per line or comma separated, any CSS color</label>
            {text !== MURAL && (
              <button type="button" className="text-btn" onClick={() => setText(MURAL)}>
                Load mural preset
              </button>
            )}
          </div>
          <textarea
            id={`${errorId}-seeds`}
            rows={5}
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={invalid.length > 0}
            aria-describedby={invalid.length > 0 ? errorId : undefined}
          />
        </div>
        {invalid.length > 0 && (
          <p className="error" id={errorId} role="alert">
            Not a color, left out:{" "}
            {invalid.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && ", "}
                <code>{c}</code>
              </Fragment>
            ))}
          </p>
        )}
      </Group>

      <Group legend="Method">
        {method.controls}
        <Slider label="Offset" value={offset} onChange={setOffset} min={0} max={360} />
      </Group>

      <Group legend="Lightness and chroma">
        <ToneControls tone={shownTone} onChange={setCustom} autoLabel={seeds.length > 0 ? "Auto (from the seeds)" : "Auto (default)"} auto={!custom} />
      </Group>

      {zones.controls}
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      <div className="figures">
        <figure>
          <PolarPlot colors={result.hex} tone={shownTone} seeds={result.seeds} {...hover} />
          <figcaption>
            Colors by hue (angle) and chroma (distance from the center); seeds have a heavier outline. The shaded band is the
            chroma each hue can get, inferred from the seeds unless you change it.
          </figcaption>
        </figure>
      </div>
      <Swatches colors={result.hex} seeds={result.seeds} {...hover} />
      <Quality colors={result.hex} ms={result.ms} label={result.method} comparison={comparison} seeds={result.seeds} endZone={result.endZone} {...hover} />
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
