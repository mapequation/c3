import { Fragment, useDeferredValue, useId, useMemo, useState } from "react";
import { oklch, sequential, type Range, type SequentialOptions } from "@mapequation/c3";
import { defaultSequentialOptions } from "@mapequation/c3/internal";
import { Check, EndSliders, Group, ModeLayout, RangeSliders } from "../components/Controls";
import { ScalePlot } from "../components/ScalePlot";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { useHover } from "../components/Hover";
import { sequentialCode } from "../code";
import { parseColors, unlessDefault } from "../util";

const EXAMPLES: [label: string, colors: string[]][] = [
  ["one", ["#2b9bea"]],
  ["two", ["#2a9d8f", "#e9c46a"]],
  ["three", ["#0c2c84", "#41b6c4", "#ffffcc"]],
];

const SAMPLES = 200;

const sameRange = (a: readonly number[], b: readonly number[]) => a[0] === b[0] && a[1] === b[1];

export function SequentialMode({ n, setN }: { n: number; setN: (n: number) => void }) {
  const [text, setText] = useState(EXAMPLES[0][1].join("\n"));
  const [lightness, setLightness] = useState<Range>(defaultSequentialOptions.lightness);
  const [lightChroma, setLightChroma] = useState(defaultSequentialOptions.lightChroma);
  const [darkChroma, setDarkChroma] = useState(defaultSequentialOptions.darkChroma);
  const [lightHue, setLightHue] = useState(defaultSequentialOptions.lightHue);
  const [darkHue, setDarkHue] = useState(defaultSequentialOptions.darkHue);
  const [reverse, setReverse] = useState(defaultSequentialOptions.reverse);
  const errorId = useId();
  // Highlighted colors by index, linked across the plot and the swatches
  const [hovered, onHover] = useHover();
  const hover = { hovered, onHover };

  const { valid: anchors, invalid } = useMemo(() => parseColors(text), [text]);

  const options = useMemo<SequentialOptions>(
    () => ({
      lightness: sameRange(lightness, defaultSequentialOptions.lightness) ? undefined : lightness,
      lightChroma: unlessDefault(lightChroma, defaultSequentialOptions.lightChroma),
      darkChroma: unlessDefault(darkChroma, defaultSequentialOptions.darkChroma),
      lightHue: unlessDefault(lightHue, defaultSequentialOptions.lightHue),
      darkHue: unlessDefault(darkHue, defaultSequentialOptions.darkHue),
      reverse: unlessDefault(reverse, defaultSequentialOptions.reverse),
    }),
    [lightness, lightChroma, darkChroma, lightHue, darkHue, reverse],
  );

  const deferred = useDeferredValue(useMemo(() => ({ n, anchors, options }), [n, anchors, options]));
  const result = useMemo(() => {
    const { n, anchors, options } = deferred;
    if (anchors.length === 0) return { error: "Add at least one color." };
    try {
      const scale = sequential(anchors, options);
      // colors(n) holds every anchor, so never fewer colors than anchors
      const count = Math.max(n, anchors.length);
      const steps = scale.colors(count);
      // Each step's place on the scale, from its lightness
      const Ls = anchors.map((c) => oklch(c)[0]);
      const [lo, hi] = options.lightness ?? defaultSequentialOptions.lightness;
      const Lmin = Math.min(lo, ...Ls);
      const Lmax = Math.max(hi, ...Ls);
      const positions = steps.map((c) => {
        const t = Math.min(1, Math.max(0, (Lmax - oklch(c)[0]) / (Lmax - Lmin)));
        return options.reverse ? 1 - t : t;
      });
      // With as many colors as anchors, colors() gives the anchors as hex
      const anchorHex = new Set(scale.colors(anchors.length));
      return {
        steps,
        positions,
        anchors: steps.map((c) => anchorHex.has(c)),
        samples: Array.from({ length: SAMPLES }, (_, i) => scale(i / (SAMPLES - 1))),
        code: sequentialCode(anchors, options, count, scale(0.5)),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [deferred]);

  const problems = [
    ...(invalid.length > 0 ? [`Not a color, left out: ${invalid.join(", ")}.`] : []),
    ...("error" in result ? [result.error] : []),
  ];

  const controls = (
    <>
      <Group legend="Anchor colors">
        <div className="field">
          <div className="field-head">
            <label htmlFor={`${errorId}-anchors`}>One per line or comma separated, any CSS color</label>
          </div>
          <textarea
            id={`${errorId}-anchors`}
            rows={4}
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={problems.length > 0}
            aria-describedby={problems.length > 0 ? errorId : undefined}
          />
          <p className="examples">
            Examples:{" "}
            {EXAMPLES.map(([label, colors], i) => (
              <Fragment key={label}>
                {i > 0 && ", "}
                <button type="button" className="text-btn" onClick={() => setText(colors.join("\n"))}>
                  {label} {i === 0 ? "color" : "colors"}
                </button>
              </Fragment>
            ))}
          </p>
        </div>
        {problems.length > 0 && (
          <p className="error" id={errorId} role="alert">
            {problems.join(" ")}
          </p>
        )}
      </Group>

      <Group legend="Ends">
        <RangeSliders label="Lightness" value={lightness} onChange={setLightness} min={0} max={1} step={0.01} />
        <EndSliders
          label="Chroma"
          value={[lightChroma, darkChroma]}
          onChange={([light, dark]) => {
            setLightChroma(light);
            setDarkChroma(dark);
          }}
          min={0}
          max={2}
          step={0.05}
        />
        <EndSliders
          label="Hue"
          value={[lightHue, darkHue]}
          onChange={([light, dark]) => {
            setLightHue(light);
            setDarkHue(dark);
          }}
          min={-90}
          max={90}
        />
        <Check label="Reverse, dark to light" checked={reverse} onChange={setReverse} />
      </Group>
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      {"error" in result ? null : (
        <>
          <figure className="wide">
            <ScalePlot
              samples={result.samples}
              steps={result.steps}
              positions={result.positions}
              anchors={result.anchors}
              {...hover}
            />
            <figcaption>
              The scale from <code>t</code> = 0 to 1, and below it the chroma (how colorful a color is) along it. Lightness
              changes evenly along the scale. The dots are the colors of <code>colors(n)</code>; anchors have a heavier
              outline. Each color is as colorful as the anchors, relative to the most sRGB has at its lightness and hue, so
              chroma rises where sRGB allows more and fades toward black and white. Light and dark chroma scale that
              toward each end, and light and dark hue turn the hue there, in degrees from the nearest anchor.
            </figcaption>
          </figure>
          <Swatches colors={result.steps} {...hover} />
          <CodeSnippet code={result.code} colors={result.steps} {...hover} />
        </>
      )}
    </ModeLayout>
  );
}
