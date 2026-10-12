import { Fragment, useDeferredValue, useId, useMemo, useState } from "react";
import { defaultExtendOptions, extend, inferRegion, oklch, presets, type ExtendOptions, type Region } from "@mapequation/c3";
import { Check, Group, ModeLayout, RegionControls, Slider } from "../components/Controls";
import { PolarPlot } from "../components/PolarPlot";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { callCode } from "../code";
import { isMural, regionDiff, unlessDefault } from "../util";

const MURAL = presets.mural.join("\n");

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
  return { valid: isMural(valid) ? presets.mural : valid, invalid };
}

export function ExtendMode({ n, setN }: { n: number; setN: (n: number) => void }) {
  const [text, setText] = useState(MURAL);
  const [method, setMethod] = useState<"greedy" | "halton">(defaultExtendOptions.method);
  const [hue, setHue] = useState(defaultExtendOptions.hue);
  const [override, setOverride] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const errorId = useId();

  const { valid: seeds, invalid } = useMemo(() => parseSeeds(text), [text]);
  const inferred = useMemo(() => inferRegion(seeds), [seeds]);
  const shownRegion = override && region ? region : inferred;

  const options = useMemo<ExtendOptions>(
    () => ({
      method: unlessDefault(method, defaultExtendOptions.method),
      hue: unlessDefault(hue, defaultExtendOptions.hue),
      ...regionDiff(shownRegion, inferred),
    }),
    [method, hue, shownRegion, inferred],
  );

  const deferred = useDeferredValue(useMemo(() => ({ n, seeds, options }), [n, seeds, options]));
  const result = useMemo(() => {
    const { n, seeds, options } = deferred;
    return { hex: extend(seeds, n, options), code: callCode("extend", seeds, n, options), seeds: seeds.length };
  }, [deferred]);

  const controls = (
    <>
      <Group legend="Seed colors">
        <label className="field" htmlFor={`${errorId}-seeds`}>
          <span>One per line or comma separated, any CSS color</span>
        </label>
        <textarea
          id={`${errorId}-seeds`}
          rows={6}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={invalid.length > 0}
          aria-describedby={invalid.length > 0 ? errorId : undefined}
        />
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
        <button type="button" className="btn" onClick={() => setText(MURAL)} disabled={text === MURAL}>
          Load mural preset
        </button>
      </Group>

      <Group legend="Method">
        <label className="field">
          <span>How new colors are picked</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="greedy">greedy: farthest of 4096 candidates</option>
            <option value="halton">halton: best of the next Halton points</option>
          </select>
        </label>
        <Slider label="Hue offset" value={hue} onChange={setHue} min={0} max={360} />
      </Group>

      <Group legend="Region">
        <Check
          label="Override the inferred region"
          checked={override}
          onChange={(on) => {
            setOverride(on);
            if (on) setRegion(inferred);
          }}
        />
        <RegionControls region={shownRegion} onChange={setRegion} disabled={!override} />
        {override && (
          <button type="button" className="btn" onClick={() => setRegion(inferred)}>
            Reset to inferred
          </button>
        )}
      </Group>
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      <div className="figures">
        <figure>
          <PolarPlot colors={result.hex} region={shownRegion} seeds={result.seeds} />
          <figcaption>
            Hue as angle, chroma as distance from the center (OKLCH). Seeds have a heavier outline. The shaded band is the
            region new colors are picked from, inferred from the seeds unless you override it.
          </figcaption>
        </figure>
      </div>
      <Swatches colors={result.hex} seeds={result.seeds} />
      <CodeSnippet code={result.code} colors={result.hex} />
    </ModeLayout>
  );
}
