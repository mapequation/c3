import { useId, useMemo } from "react";
import { oklch } from "@mapequation/c3";
import { delegatedHover, NONE, type Hover } from "./Hover";
import { chromaLimits } from "../util";

const W = 640;
const LEFT = 56; // room for the chroma axis title and labels
const RIGHT = 12;
const BAR = 32;
const GAP = 16;
const PLOT = 150;
const BOTTOM = 22; // room for the t labels
const H = BAR + GAP + PLOT + BOTTOM;
const STEP = 0.05; // chroma between grid lines

const x = (t: number) => LEFT + t * (W - LEFT - RIGHT);

/**
 * A sequential scale along t: its colors as a bar, and below it their OKLCH chroma, with
 * the steps as dots at their place on the scale. Anchors get a heavier outline.
 * A dashed line shows the most chroma sRGB has at each lightness and hue along the scale.
 * Hovering a dot highlights its color in the other views; hovered colors get a ring.
 * @param samples colors at evenly spaced t from 0 to 1
 * @param positions t of each step
 * @param anchors whether each step is an anchor
 */
export function ScalePlot({
  samples,
  steps,
  positions,
  anchors,
  hovered = NONE,
  onHover,
}: { samples: string[]; steps: string[]; positions: number[]; anchors: readonly boolean[] } & Partial<Hover>) {
  const gradient = useId();

  // Everything but the highlight, so hovering does not redraw the plot
  const plot = useMemo(() => {
    const lch = samples.map(oklch);
    const curve = lch.map(([, C]) => C);
    const limit = chromaLimits(lch);
    const chroma = steps.map((c) => oklch(c)[1]);
    const max = Math.ceil(Math.max(0.1, ...curve, ...chroma, ...(limit ?? [])) / STEP) * STEP;
    const y = (c: number) => BAR + GAP + PLOT * (1 - c / max);
    const grid = Array.from({ length: Math.round(max / STEP) + 1 }, (_, i) => i * STEP);
    const path = (values: number[]) =>
      values.map((c, i) => `${x(i / (values.length - 1)).toFixed(1)},${y(c).toFixed(1)}`).join("L");
    const dot = Math.max(3.5, Math.min(7, 32 / Math.sqrt(steps.length)));
    const radius = (i: number) => (anchors[i] ? dot + 1.5 : dot);
    const dotClass = (i: number) => (anchors[i] ? "polar-dot seed" : "polar-dot");
    const xy = steps.map((_, i) => [x(positions[i]), y(chroma[i])] as const);

    const content = (
      <>
        <defs>
          <linearGradient id={gradient}>
            {samples.map((c, i) => (
              <stop key={i} offset={i / (samples.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
        </defs>
        <rect x={x(0)} y={0} width={x(1) - x(0)} height={BAR} rx={3} fill={`url(#${gradient})`} />
        {grid.map((c) => (
          <g key={c}>
            <line className="polar-grid" x1={x(0)} x2={x(1)} y1={y(c)} y2={y(c)} />
            <text className="polar-label small" x={LEFT - 6} y={y(c) + 3} textAnchor="end">
              {c.toFixed(2)}
            </text>
          </g>
        ))}
        <text
          className="polar-label"
          transform={`translate(12 ${BAR + GAP + PLOT / 2}) rotate(-90)`}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          OKLCH chroma
        </text>
        <text className="polar-label" x={x(0)} y={H - 6} textAnchor="start">
          t = 0
        </text>
        <text className="polar-label" x={x(1)} y={H - 6} textAnchor="end">
          1
        </text>
        {limit && <path className="gamut-line" d={`M${path(limit)}`} />}
        <path className="scale-line" d={`M${path(curve)}`} />
        {steps.map((c, i) => (
          <circle key={i} data-i={i} cx={xy[i][0]} cy={xy[i][1]} r={radius(i)} fill={c} className={dotClass(i)}>
            <title>{`${i + 1}${anchors[i] ? " (anchor)" : ""} ${c}`}</title>
          </circle>
        ))}
      </>
    );
    return { content, xy, radius, dotClass };
  }, [samples, steps, positions, anchors, gradient]);

  return (
    <svg
      className="scale-plot"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`A sequential scale and the OKLCH chroma of ${steps.length} colors along it`}
      {...(onHover && delegatedHover(onHover))}
    >
      {plot.content}
      {hovered
        .filter((i) => i < steps.length)
        .map((i) => {
          const [cx, cy] = plot.xy[i];
          return (
            <g key={i} pointerEvents="none">
              <circle cx={cx} cy={cy} r={plot.radius(i)} fill={steps[i]} className={plot.dotClass(i)} />
              <circle className="ring hover" cx={cx} cy={cy} r={plot.radius(i) + 3} />
            </g>
          );
        })}
    </svg>
  );
}
