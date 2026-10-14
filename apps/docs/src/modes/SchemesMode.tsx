import { useDeferredValue, useMemo, useState } from "react";
import { colors, Node, palette, stops, type Options, type SchemeName } from "@mapequation/c3";
import { Check, Group, ModeLayout, SchemeOptions, Slider } from "../components/Controls";
import { ColorWheel } from "../components/ColorWheel";
import { ColorBar } from "../components/ColorBar";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { Quality } from "../components/Quality";
import { callCode } from "../code";
import { timed, toHex, unlessDefault } from "../util";

const RING_SAMPLES = 120;

/** The scheme as colors() sees it at the top of the Cantor set, sampled evenly over [0, 1] */
function sampleScheme(count: number, options: Options) {
  const nodes = Array.from({ length: count }, (_, k) => {
    const t = (k + 0.5) / count;
    return new Node(t, t);
  });
  return colors(nodes, options).map(toHex);
}

export function SchemesMode({ n, setN }: { n: number; setN: (n: number) => void }) {
  const [scheme, setScheme] = useState<SchemeName>("Sinebow");
  const [reverse, setReverse] = useState(false);
  const [offset, setOffset] = useState(0);
  const [adjust, setAdjust] = useState(true);
  const [saturation, setSaturation] = useState(0.55);
  const [saturationEnd, setSaturationEnd] = useState(0.8);
  const [lightness, setLightness] = useState(0.5);
  const [lightnessEnd, setLightnessEnd] = useState(0.9);
  const [midpoint, setMidpoint] = useState(4.5);
  const [steepness, setSteepness] = useState(1);
  const [skewness, setSkewness] = useState(0);
  const [strength, setStrength] = useState(1);

  const options = useMemo<Options>(
    () => ({
      scheme,
      ...(adjust && {
        saturation,
        saturationEnd,
        lightness,
        lightnessEnd,
        midpoint: unlessDefault(midpoint, 4),
        steepness: unlessDefault(steepness, 1),
      }),
      offset: offset || undefined,
      reverse: reverse || undefined,
      // Without skewness the weights are equal and strength has no effect
      skewness: skewness || undefined,
      strength: skewness ? strength : undefined,
    }),
    [scheme, adjust, saturation, saturationEnd, lightness, lightnessEnd, midpoint, steepness, offset, reverse, skewness, strength],
  );

  const deferred = useDeferredValue(useMemo(() => ({ n, options }), [n, options]));

  const result = useMemo(() => {
    const { n, options } = deferred;
    const { skewness = 0, strength = 0 } = options;
    const [picked, ms] = timed(() => colors(n, options));
    return {
      hex: picked.map(toHex),
      ms,
      stops: stops(n, { skewness, strength }),
      ring: sampleScheme(RING_SAMPLES, options),
      code: callCode("colors", n, options),
    };
  }, [deferred]);

  // Why colors() is deprecated: palette() with the same scheme
  const comparison = useMemo(() => {
    const { n, options } = deferred;
    const { scheme, offset, reverse } = options;
    const [picked, ms] = timed(() => palette(n, { hue: scheme, offset, reverse }));
    return { label: "palette()", colors: picked, ms };
  }, [deferred]);

  const controls = (
    <>
      <Group legend="Scheme">
        <label className="field">
          <span>d3 color scheme</span>
          <select
            value={scheme}
            onChange={(e) => {
              const name = e.target.value as SchemeName;
              setScheme(name);
              // Fixed lightness flattens a grey scale to a single grey
              if (name === "Greys") setAdjust(false);
            }}
          >
            <SchemeOptions />
          </select>
        </label>
        <Check label="Reverse direction" checked={reverse} onChange={setReverse} />
        <Slider label="Offset" value={offset} onChange={setOffset} min={0} max={1} step={0.01} />
        <p className="hint">Offset shifts the Cantor stops along the scheme.</p>
      </Group>

      <Group legend="Saturation and lightness">
        <Check label="Change with each round of Cantor stops" checked={adjust} onChange={setAdjust} />
        <Slider label="Saturation" value={saturation} onChange={setSaturation} min={0} max={1} step={0.01} disabled={!adjust} />
        <Slider label="Saturation end" value={saturationEnd} onChange={setSaturationEnd} min={0} max={1} step={0.01} disabled={!adjust} />
        <Slider label="Lightness" value={lightness} onChange={setLightness} min={0} max={1} step={0.01} disabled={!adjust} />
        <Slider label="Lightness end" value={lightnessEnd} onChange={setLightnessEnd} min={0} max={1} step={0.01} disabled={!adjust} />
        <Slider label="Midpoint" value={midpoint} onChange={setMidpoint} min={0} max={8} step={0.1} disabled={!adjust} />
        <Slider label="Steepness" value={steepness} onChange={setSteepness} min={0} max={5} step={0.1} disabled={!adjust} />
        <p className="hint">
          HSL saturation and lightness go from their first to their end value as the rounds go on. Midpoint is the round
          halfway between; Steepness sets how sudden the change is.
        </p>
      </Group>

      <Group legend="Weights">
        <Slider label="Skewness" value={skewness} onChange={setSkewness} min={0} max={1} step={0.01} />
        <Slider label="Strength" value={strength} onChange={setStrength} min={0} max={1} step={0.01} disabled={!skewness} />
        <p className="hint">Skewness, also deprecated, gives the first colors more hue space; Strength sets how much.</p>
      </Group>
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      <div className="figures">
        <figure>
          <ColorWheel stops={result.stops} colors={result.hex} ring={result.ring} />
          <figcaption>The Cantor stops around the scheme, in order.</figcaption>
        </figure>
      </div>
      <ColorBar colors={result.hex} />
      <Swatches colors={result.hex} />
      <Quality colors={result.hex} ms={result.ms} label="colors()" comparison={comparison} />
      <CodeSnippet code={result.code} colors={result.hex} />
    </ModeLayout>
  );
}
