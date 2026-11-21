import { Fragment, useDeferredValue, useId, useMemo, useState } from "react";
import {
  oklch,
  palette,
  sequential,
  tones,
  type Range,
  type SchemeName,
  type SequentialOptions,
  type SequentialPath,
  type ToneName,
} from "@mapequation/c3";
import { defaultOffset, defaultPaletteOptions, defaultSequentialOptions, schemeLightness } from "@mapequation/c3/internal";
import { Check, EndSliders, Group, ModeLayout, SchemeOptions, Slider } from "../components/Controls";
import { PolarPlot } from "../components/PolarPlot";
import { ScalePlot } from "../components/ScalePlot";
import { Swatches } from "../components/Swatches";
import { CodeSnippet } from "../components/CodeSnippet";
import { useHover } from "../components/Hover";
import { sequentialCode } from "../code";
import { parseColors, unlessDefault } from "../util";

const EXAMPLES: [label: string, colors: string[]][] = [
  ["none", []],
  ["one color", ["#2b9bea"]],
  ["two colors", ["#2a9d8f", "#e9c46a"]],
  ["three colors", ["#0c2c84", "#41b6c4", "#ffffcc"]],
  ["blue to orange", ["#0b7baa", "#f68758"]],
  ["near white to brown", ["#fff5eb", "#7f2704"]],
];

const TONES = Object.keys(tones) as ToneName[];

const SAMPLES = 200;

const sameRange = (a: readonly number[], b: readonly number[]) => a[0] === b[0] && a[1] === b[1];

/** The lightness range a scale has by default: a scheme's own, else the default */
const defaultRange = (scheme?: SchemeName): Range => (scheme ? schemeLightness(scheme) : defaultSequentialOptions.lightness);

/** Whether a scale can follow the scheme: its lightness goes one way */
function followable(name: SchemeName) {
  try {
    schemeLightness(name);
    return true;
  } catch {
    return false;
  }
}

// Few colors, so the steps are easy to tell apart; for a smooth scale call it with t instead
const DEFAULT_N = 8;

// Its own number of colors, like the hierarchy, rather than the one the palette tabs share
export function SequentialMode(_props: { n: number; setN: (n: number) => void }) {
  const [n, setN] = useState(DEFAULT_N);
  const [text, setText] = useState(EXAMPLES[1][1].join("\n"));
  // The palette color the scale goes through without seeds
  const [source, setSource] = useState<"Oklch" | SchemeName>(defaultPaletteOptions.hue);
  const [offset, setOffset] = useState(defaultOffset(defaultPaletteOptions.hue));
  const [tone, setTone] = useState<ToneName | "auto">("auto");
  // Unset for the default, which a scheme has of its own
  const [lightnessSet, setLightness] = useState<Range>();
  const [lightChroma, setLightChroma] = useState(defaultSequentialOptions.lightChroma);
  const [darkChroma, setDarkChroma] = useState(defaultSequentialOptions.darkChroma);
  const [lightHue, setLightHue] = useState(defaultSequentialOptions.lightHue);
  const [darkHue, setDarkHue] = useState(defaultSequentialOptions.darkHue);
  const [reverse, setReverse] = useState(defaultSequentialOptions.reverse);
  const [path, setPath] = useState<SequentialPath>(defaultSequentialOptions.path);
  const errorId = useId();
  // Highlighted colors by index, linked across the plot and the swatches
  const [hovered, onHover] = useHover();
  const hover = { hovered, onHover };

  const { valid: seeds, invalid } = useMemo(() => parseColors(text), [text]);
  const noSeeds = seeds.length === 0;
  // The path only matters between seeds
  const between = seeds.length > 1;
  // Without seeds, a scheme is followed; tone and offset are for one color on the OKLCH hue circle
  const scheme = noSeeds && source !== "Oklch" ? source : undefined;
  const defaultLightness = useMemo(() => defaultRange(scheme), [scheme]);
  const lightness = lightnessSet ?? defaultLightness;

  const options = useMemo<SequentialOptions>(
    () => ({
      seeds: noSeeds ? undefined : seeds,
      // The hue source only matters without seeds, and tone and offset only on the hue circle
      hue: noSeeds ? unlessDefault(source, defaultPaletteOptions.hue) : undefined,
      offset: noSeeds && !scheme ? unlessDefault(offset, defaultOffset(source)) : undefined,
      tone: noSeeds && !scheme && tone !== "auto" ? tone : undefined,
      lightness: sameRange(lightness, defaultLightness) ? undefined : lightness,
      lightChroma: unlessDefault(lightChroma, defaultSequentialOptions.lightChroma),
      darkChroma: unlessDefault(darkChroma, defaultSequentialOptions.darkChroma),
      lightHue: unlessDefault(lightHue, defaultSequentialOptions.lightHue),
      darkHue: unlessDefault(darkHue, defaultSequentialOptions.darkHue),
      reverse: unlessDefault(reverse, defaultSequentialOptions.reverse),
      path: between ? unlessDefault(path, defaultSequentialOptions.path) : undefined,
    }),
    [noSeeds, between, scheme, seeds, source, offset, tone, lightness, defaultLightness, lightChroma, darkChroma, lightHue, darkHue, reverse, path],
  );

  const deferred = useDeferredValue(useMemo(() => ({ n, options }), [n, options]));
  const result = useMemo(() => {
    const { n, options } = deferred;
    try {
      const scale = sequential(options);
      // The scheme the scale follows, from the deferred options so it matches them
      const followed = !options.seeds && options.hue !== undefined && options.hue !== "Oklch" ? options.hue : undefined;
      // The colors the scale goes through: the seeds, none on a scheme, or the palette color
      const anchors =
        options.seeds ?? (followed ? [] : palette(1, { hue: options.hue, offset: options.offset, tone: options.tone }));
      // colors(n) holds every anchor, so never fewer colors than anchors
      const count = Math.max(n, anchors.length);
      const steps = scale.colors(count);
      // Each step's place on the scale, from its lightness
      const Ls = anchors.map((c) => oklch(c)[0]);
      const [lo, hi] = options.lightness ?? defaultRange(followed as SchemeName | undefined);
      const Lmin = Math.min(lo, ...Ls);
      const Lmax = Math.max(hi, ...Ls);
      const positions = steps.map((c) => {
        const t = Math.min(1, Math.max(0, (Lmax - oklch(c)[0]) / (Lmax - Lmin)));
        return options.reverse ? 1 - t : t;
      });
      // With as many colors as anchors, colors() gives the anchors as hex
      const anchorHex = new Set(anchors.length > 0 ? scale.colors(anchors.length) : []);
      return {
        steps,
        positions,
        anchors: steps.map((c) => anchorHex.has(c)),
        samples: Array.from({ length: SAMPLES }, (_, i) => scale(i / (SAMPLES - 1))),
        code: sequentialCode(options, count, scale(0.5)),
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
      <Group legend="Seed colors">
        <div className="field">
          <div className="field-head">
            <label htmlFor={`${errorId}-seeds`}>One per line or comma separated, any CSS color</label>
          </div>
          <textarea
            id={`${errorId}-seeds`}
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
                  {label}
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
        <fieldset className="plain" disabled={!between}>
          <label className="field">
            <span>Path between seeds</span>
            <select value={path} onChange={(e) => setPath(e.target.value as SequentialPath)}>
              <option value="relative">Share of the sRGB limit (relative)</option>
              <option value="straight">Straight through OKLab (straight)</option>
            </select>
          </label>
        </fieldset>
      </Group>

      <Group legend="Without seeds">
        <p className="hint">
          {!noSeeds
            ? "Used only without seeds: the scale then follows a scheme, or goes through the first color of palette() with this offset and tone."
            : scheme
              ? "The scale follows the scheme, from light to dark. Lightness, chroma and hue below stretch and retone it."
              : "The scale goes through the first color of palette() with this offset and tone."}
        </p>
        <fieldset className="plain" disabled={!noSeeds}>
          <label className="field">
            <span>Hue source</span>
            <select
              value={source}
              onChange={(e) => {
                const next = e.target.value as typeof source;
                setSource(next);
                setOffset(defaultOffset(next));
                // Each scheme has its own lightness range
                setLightness(undefined);
              }}
            >
              <option value="Oklch">Oklch (OKLCH hue circle)</option>
              <SchemeOptions filter={followable} />
            </select>
          </label>
          <fieldset className="plain" disabled={!!scheme}>
            <Slider label="Offset" value={offset} onChange={setOffset} min={0} max={360} />
            <label className="field">
              <span>Tone</span>
              <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}>
                <option value="auto">Auto (strong)</option>
                {TONES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </fieldset>
        </fieldset>
      </Group>

      <Group legend="Ends">
        <EndSliders
          rows={[
            {
              label: "Lightness",
              value: [lightness[1], lightness[0]],
              onChange: ([light, dark]) => setLightness([dark, light]),
              ordered: true,
              min: 0,
              max: 1,
              step: 0.01,
            },
            {
              label: "Chroma",
              value: [lightChroma, darkChroma],
              onChange: ([light, dark]) => {
                setLightChroma(light);
                setDarkChroma(dark);
              },
              min: 0,
              max: 2,
              step: 0.05,
            },
            {
              label: "Hue",
              value: [lightHue, darkHue],
              onChange: ([light, dark]) => {
                setLightHue(light);
                setDarkHue(dark);
              },
              min: -90,
              max: 90,
            },
          ]}
        />
        <Check label="Reverse, dark to light" checked={reverse} onChange={setReverse} />
      </Group>
    </>
  );

  return (
    <ModeLayout n={n} setN={setN} controls={controls}>
      {"error" in result ? null : (
        <>
          {/* The circle beside the scale, so the swatches stay right under its gradient */}
          <div className="scale-views">
            <figure className="scale-figure">
              <ScalePlot
                samples={result.samples}
                steps={result.steps}
                positions={result.positions}
                anchors={result.anchors}
                {...hover}
              />
              <Swatches colors={result.steps} {...hover} />
              <figcaption>
                The chroma (how colorful a color is) along the scale, and below it the scale from <code>t</code> = 0 to 1
                and the colors of <code>colors(n)</code>. Lightness changes evenly along the scale. The dots are the
                colors of <code>colors(n)</code>; seeds have a heavier outline. The dashed line is the most chroma sRGB
                has at each lightness and hue along the scale. The scale keeps the seeds' share of that, so chroma
                rises where sRGB allows more and fades toward black and white; between seeds of very different hue the
                share dips, so they meet in a greyish color. Chroma at the ends scales that share toward each end, and
                hue at the ends turns the hue there, in degrees from the nearest seed. A straight path goes from seed
                to seed in a straight line through OKLab instead, never more colorful than the seeds. A scheme is
                followed with its own colors; the lightness range stretches it, and chroma and hue at the ends scale
                its share and turn its hue, changing evenly from one end to the other.
              </figcaption>
            </figure>
            <figure className="scale-circle">
              <PolarPlot colors={result.steps} anchors={result.anchors} path={result.samples} limits {...hover} />
              <figcaption>
                The steps by hue (angle) and chroma (distance from the center), with the scale as a line through them.
                The dashed lines go out to the most chroma sRGB has at each step's lightness and hue.
              </figcaption>
            </figure>
          </div>
          <CodeSnippet code={result.code} colors={result.steps} {...hover} />
        </>
      )}
    </ModeLayout>
  );
}
