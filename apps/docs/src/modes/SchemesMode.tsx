import { useDeferredValue, useMemo, useState } from "react";
import { colors, getDefaultWeights, Node, stops, type Options, type SchemeName } from "@mapequation/c3";
import { Check, Group, ModeLayout, Slider } from "../components/Controls";
import { ColorWheel } from "../components/ColorWheel";
import { ColorCantor } from "../components/ColorCantor";
import { ColorBar } from "../components/ColorBar";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { callCode } from "../code";
import { toHex, unlessDefault } from "../util";

const SCHEMES: Record<string, SchemeName[]> = {
  Cyclical: ["Sinebow", "Rainbow"],
  Sequential: ["Turbo", "Viridis", "Cividis", "CubehelixDefault", "YlGnBu", "YlOrRd", "Blues", "Greys"],
  Diverging: ["Spectral", "RdYlBu", "RdYlGn", "BrBG", "PiYG", "PuOr"],
};

const RING_SAMPLES = 120;
const LEVEL_SAMPLES = 48;
const CANTOR_LEVELS = 5;

/** The scheme as colors() sees it at a Cantor depth, sampled evenly over [0, 1] */
function sampleScheme(count: number, level: number, options: Options) {
  const nodes = Array.from({ length: count }, (_, k) => {
    const t = (k + 0.5) / count;
    return new Node(t, t, 1, 1, level);
  });
  return colors(nodes, { ...options, vary: undefined }).map(toHex);
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
  const [vary, setVary] = useState(false);
  const [variation, setVariation] = useState(1);

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
      vary: vary ? (variation === 1 ? true : variation) : undefined,
    }),
    [scheme, adjust, saturation, saturationEnd, lightness, lightnessEnd, midpoint, steepness, offset, reverse, skewness, strength, vary, variation],
  );

  const deferred = useDeferredValue(useMemo(() => ({ n, options }), [n, options]));

  const result = useMemo(() => {
    const { n, options } = deferred;
    const { skewness = 0, strength = 0 } = options;
    return {
      hex: colors(n, options).map(toHex),
      stops: stops(n, { skewness, strength }),
      weights: getDefaultWeights(n, skewness),
      strength,
      ring: sampleScheme(RING_SAMPLES, 0, options),
      levels: Array.from({ length: CANTOR_LEVELS }, (_, level) => sampleScheme(LEVEL_SAMPLES, level, options)),
      code: callCode("colors", n, options),
    };
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
            {Object.entries(SCHEMES).map(([group, names]) => (
              <optgroup key={group} label={group}>
                {names.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <Check label="Reverse" checked={reverse} onChange={setReverse} />
        <Slider label="Offset" value={offset} onChange={setOffset} min={0} max={1} step={0.01} />
      </Group>

      <Group legend="Saturation and lightness">
        <Check label="Set by depth in the Cantor set" checked={adjust} onChange={setAdjust} />
        <Slider label="Saturation" value={saturation} onChange={setSaturation} min={0} max={1} step={0.01} disabled={!adjust} />
        <Slider label="Saturation end" value={saturationEnd} onChange={setSaturationEnd} min={0} max={1} step={0.01} disabled={!adjust} />
        <Slider label="Lightness" value={lightness} onChange={setLightness} min={0} max={1} step={0.01} disabled={!adjust} />
        <Slider label="Lightness end" value={lightnessEnd} onChange={setLightnessEnd} min={0} max={1} step={0.01} disabled={!adjust} />
        <Slider label="Midpoint" value={midpoint} onChange={setMidpoint} min={0} max={8} step={0.1} disabled={!adjust} />
        <Slider label="Steepness" value={steepness} onChange={setSteepness} min={0} max={5} step={0.1} disabled={!adjust} />
      </Group>

      <Group legend="Weights">
        <Slider label="Skewness" value={skewness} onChange={setSkewness} min={0} max={1} step={0.01} />
        <Slider label="Strength" value={strength} onChange={setStrength} min={0} max={1} step={0.01} disabled={!skewness} />
      </Group>

      <Group legend="Variation">
        <Check label="Vary lightness and chroma" checked={vary} onChange={setVary} />
        <Slider label="Amount" value={variation} onChange={setVariation} min={0} max={3} step={0.1} disabled={!vary} />
      </Group>
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      <div className="figures">
        <figure>
          <ColorWheel stops={result.stops} colors={result.hex} ring={result.ring} />
          <figcaption>Color stops around the scheme, in order.</figcaption>
        </figure>
        <figure>
          <ColorCantor weights={result.weights} strength={result.strength} colors={result.hex} levels={result.levels} />
          <figcaption>How the first 16 stops split the interval. Each band shows the scheme at that depth.</figcaption>
        </figure>
      </div>
      <ColorBar colors={result.hex} />
      <Swatches colors={result.hex} />
      <CodeSnippet code={result.code} colors={result.hex} />
    </ModeLayout>
  );
}
