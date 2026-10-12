import { useDeferredValue, useMemo, useState } from "react";
import { defaultPaletteOptions, defaultRegion, inferRegion, palette, presets, type PaletteOptions, type Region } from "@mapequation/c3";
import { Check, Group, ModeLayout, RegionControls, Slider } from "../components/Controls";
import { PolarPlot } from "../components/PolarPlot";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { callCode } from "../code";
import { regionDiff, unlessDefault } from "../util";

const muralRegion = inferRegion(presets.mural);

export function PaletteMode({ n, setN }: { n: number; setN: (n: number) => void }) {
  const [hue, setHue] = useState(defaultPaletteOptions.hue);
  const [reverse, setReverse] = useState(defaultPaletteOptions.reverse);
  const [lightnessOffset, setLightnessOffset] = useState(defaultPaletteOptions.lightnessOffset);
  const [chromaOffset, setChromaOffset] = useState(defaultPaletteOptions.chromaOffset);
  const [like, setLike] = useState(false);
  const [region, setRegion] = useState<Region>(defaultRegion);

  const options = useMemo<PaletteOptions>(
    () => ({
      hue: unlessDefault(hue, defaultPaletteOptions.hue),
      reverse: unlessDefault(reverse, defaultPaletteOptions.reverse),
      ...(like ? { like: presets.mural } : regionDiff(region, defaultRegion)),
      lightnessOffset: unlessDefault(lightnessOffset, defaultPaletteOptions.lightnessOffset),
      chromaOffset: unlessDefault(chromaOffset, defaultPaletteOptions.chromaOffset),
    }),
    [hue, reverse, like, region, lightnessOffset, chromaOffset],
  );

  const deferred = useDeferredValue(useMemo(() => ({ n, options }), [n, options]));
  const result = useMemo(
    () => ({
      hex: palette(deferred.n, deferred.options),
      code: callCode("palette", deferred.n, deferred.options),
    }),
    [deferred],
  );
  const shownRegion = like ? muralRegion : region;

  const controls = (
    <>
      <Group legend="Hue">
        <Slider label="First hue" value={hue} onChange={setHue} min={0} max={360} />
        <Check label="Reverse direction" checked={reverse} onChange={setReverse} />
      </Group>

      <Group legend="Region">
        <Check label="Infer from the mural preset" checked={like} onChange={setLike} />
        <RegionControls region={shownRegion} onChange={setRegion} disabled={like} />
        {!like && Object.keys(regionDiff(region, defaultRegion)).length > 0 && (
          <button type="button" className="btn" onClick={() => setRegion(defaultRegion)}>
            Reset region
          </button>
        )}
      </Group>

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
          <PolarPlot colors={result.hex} region={shownRegion} />
          <figcaption>
            Hue as angle, chroma as distance from the center (OKLCH). The shaded band is the chroma the region allows at
            each hue; it narrows away from the warm hue by the tilt.
          </figcaption>
        </figure>
      </div>
      <Swatches colors={result.hex} />
      <CodeSnippet code={result.code} colors={result.hex} />
    </ModeLayout>
  );
}
