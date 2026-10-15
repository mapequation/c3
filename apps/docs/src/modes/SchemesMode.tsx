import { useDeferredValue, useMemo, useState } from "react";
import { palette, type SchemeName } from "@mapequation/c3";
import { getScheme, stops } from "@mapequation/c3/internal";
import { Check, Group, ModeLayout, SchemeOptions, Slider } from "../components/Controls";
import { ColorWheel } from "../components/ColorWheel";
import { ColorBar } from "../components/ColorBar";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { Quality } from "../components/Quality";
import { callCode } from "../code";
import { timed, toHex, unlessDefault } from "../util";

const RING_SAMPLES = 120;

/** The scheme's own colors at positions on [0, 1], shifted by offset like palette() shifts the Cantor stops */
function schemeColors(name: SchemeName, positions: number[], offset: number, reverse: boolean) {
  const scheme = getScheme(name);
  return positions.map((p) => {
    const t = (p + offset) % 1;
    return toHex(scheme(reverse ? 1 - t : t));
  });
}

export function SchemesMode({ n, setN }: { n: number; setN: (n: number) => void }) {
  const [scheme, setScheme] = useState<SchemeName>("Sinebow");
  const [reverse, setReverse] = useState(false);
  const [offset, setOffset] = useState(0);

  const deferred = useDeferredValue(useMemo(() => ({ n, scheme, reverse, offset }), [n, scheme, reverse, offset]));

  const result = useMemo(() => {
    const { n, scheme, reverse, offset } = deferred;
    const options = { hue: scheme, offset: unlessDefault(offset, 0), reverse: unlessDefault(reverse, false) };
    const cantor = stops(n);
    const [own, ms] = timed(() => schemeColors(scheme, cantor.map((s) => s.start), offset, reverse));
    const [picked, paletteMs] = timed(() => palette(n, options));
    return {
      hex: own,
      ms,
      stops: cantor,
      ring: schemeColors(scheme, Array.from({ length: RING_SAMPLES }, (_, k) => (k + 0.5) / RING_SAMPLES), offset, reverse),
      comparison: { label: "palette()", colors: picked, ms: paletteMs },
      code: callCode("palette", n, options),
      picked,
    };
  }, [deferred]);

  const controls = (
    <>
      <Group legend="Scheme">
        <label className="field">
          <span>d3 color scheme</span>
          <select
            value={scheme}
            onChange={(e) => setScheme(e.target.value as SchemeName)}
          >
            <SchemeOptions />
          </select>
        </label>
        <Check label="Reverse direction" checked={reverse} onChange={setReverse} />
        <Slider label="Offset" value={offset} onChange={setOffset} min={0} max={1} step={0.01} />
        <p className="hint">Offset shifts the Cantor stops along the scheme.</p>
      </Group>
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      <div className="figures">
        <figure>
          <ColorWheel stops={result.stops} colors={result.hex} ring={result.ring} />
          <figcaption>The scheme's own colors at the Cantor stops, in order.</figcaption>
        </figure>
      </div>
      <ColorBar colors={result.hex} />
      <Swatches colors={result.hex} />
      <Quality colors={result.hex} ms={result.ms} label="scheme colors" comparison={result.comparison} />
      <CodeSnippet code={result.code} colors={result.picked} />
    </ModeLayout>
  );
}
