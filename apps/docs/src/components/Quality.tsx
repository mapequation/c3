import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { DISTINCT, JUST_NOTICEABLE, quality } from "../quality";

/** A palette to compare against, from the same call with one setting changed */
export type Comparison = { label: string; colors: string[]; ms: number };

type Line = { label: string; values: number[]; compare?: boolean };

const HEIGHT = 220;
const M = { top: 24, right: 12, bottom: 38, left: 38 };
const X_TICK_SPACING = 64;
const MIN_LABEL_GAP = 28;
const REF_LABEL_WIDTH = 92; // "just noticeable" in 10px monospace
const Y_CAP = 0.12;

export const formatGap = (d: number) => (Number.isFinite(d) ? d.toFixed(3) : "–");
export const formatMs = (ms: number) =>
  ms < 0.1 ? "< 0.1 ms" : `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`;

/** 1, 2 or 5 times a power of ten, so that span / step is about count */
function niceStep(span: number, count: number) {
  const raw = span / Math.max(1, count);
  const power = 10 ** Math.floor(Math.log10(raw));
  const r = raw / power;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * power;
}

/** Width of an element in CSS pixels, so the chart text keeps its size */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (w: number) => w > 0 && setWidth(Math.round(w));
    set(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => set(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

function layout(lines: Line[], width: number) {
  const n = Math.max(...lines.map((l) => l.values.length - 1));
  const kMax = Math.max(n, 3);
  const [x0, x1, y0, y1] = [M.left, width - M.right, HEIGHT - M.bottom, M.top];
  const x = (k: number) => r1(x0 + ((k - 2) / (kMax - 2)) * (x1 - x0));

  // The smallest gap only shrinks as colors are added, so the top is at k = 2.
  // The first gaps can be far larger than where palettes differ, so cap the
  // axis and pin larger values to the top edge (the readout shows them exactly).
  let top = DISTINCT * 1.25;
  for (const { values } of lines) if (Number.isFinite(values[2])) top = Math.max(top, Math.min(values[2], Y_CAP));
  const yStep = niceStep(top, 4);
  const yMax = Math.ceil(top / yStep - 1e-9) * yStep;
  const y = (v: number) => r1(y0 - (Math.min(v, yMax) / yMax) * (y0 - y1));
  const yTicks = Array.from({ length: Math.round(yMax / yStep) + 1 }, (_, i) => i * yStep);

  const xStep = Math.max(1, niceStep(kMax - 2, Math.floor((x1 - x0) / X_TICK_SPACING)));
  const xTicks: number[] = [];
  for (let t = Math.ceil(2 / xStep) * xStep; t <= kMax; t += xStep) xTicks.push(t);
  if (xTicks[0] !== 2 && x(xTicks[0]) - x(2) >= MIN_LABEL_GAP) xTicks.unshift(2);
  const last = xTicks[xTicks.length - 1];
  if (last !== kMax) {
    if (x(kMax) - x(last) < MIN_LABEL_GAP && xTicks.length > 1) xTicks.pop();
    xTicks.push(kMax);
  }

  // A step line: the gap holds until the next color arrives
  const paths = lines.map(({ values }) => {
    if (n < 2) return "";
    let d = `M${x(2)},${y(values[2])}`;
    for (let k = 3; k <= n; ++k) if (values[k] !== values[k - 1]) d += `H${x(k)}V${y(values[k])}`;
    return `${d}H${x(n)}`;
  });

  // Label the reference line in the first corner where no line crosses the label
  const yRef = y(JUST_NOTICEABLE);
  const kAt = (px: number) => Math.min(n, Math.max(2, Math.floor(2 + ((px - x0) / (x1 - x0)) * (kMax - 2))));
  const crosses = (xa: number, xb: number, ya: number, yb: number) =>
    lines.some(({ values }) => y(values[kAt(xa)]) <= yb && y(values[kAt(xb)]) >= ya); // values never increase
  const at = (x: number, y: number, anchor: "start" | "end") => ({ x, y, anchor });
  const candidates = [at(x0 + 4, yRef - 4, "start"), at(x1 - 4, yRef - 4, "end")];
  if (y0 - yRef >= 16) candidates.push(at(x0 + 4, yRef + 12, "start"), at(x1 - 4, yRef + 12, "end"));
  const refLabel =
    candidates.find(({ x, y, anchor }) => {
      const xa = anchor === "start" ? x - 2 : x - REF_LABEL_WIDTH - 2;
      return !crosses(xa, xa + REF_LABEL_WIDTH + 4, y - 10, y + 3);
    }) ?? candidates[0];

  return { n, kMax, x, y, x0, x1, y0, y1, yTicks, xTicks, paths, refLabel, digits: yStep < 0.01 ? 3 : 2 };
}

/** Smallest gap among the first k colors, for every k */
function GapChart({ lines, seeds, endZone }: { lines: Line[]; seeds: number; endZone: number }) {
  const [ref, width] = useWidth<HTMLDivElement>(560);
  const [hover, setHover] = useState<number | null>(null);
  const g = useMemo(() => layout(lines, width), [lines, width]);
  const { n, x, y, x0, x1, y0, y1 } = g;

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) * width) / rect.width;
    const k = Math.round(2 + ((px - x0) / (x1 - x0)) * (g.kMax - 2));
    setHover(Math.min(n, Math.max(2, k)));
  };

  const k = hover !== null && hover <= n ? hover : n;
  const values = lines.map((l) => formatGap(l.values[k]));
  const readout =
    lines.length > 1
      ? `${k} colors: ${lines.map((l, i) => `${values[i]} ${l.label}`).join(", ")}`
      : `${k} colors: smallest gap ${values[0]}`;
  const showSeeds = seeds >= 2 && seeds <= n;
  const seedsLeft = x(seeds) - x0 >= 40;
  // The end zone starts with color endZone + 1, so mark where k reaches it
  const zoneK = endZone + 1;
  const showZone = zoneK >= 2 && zoneK <= n;
  const zoneRight = x1 - x(zoneK) >= 64;
  // Drop the label a line when the seeds label is close
  const zoneY = showSeeds && Math.abs(x(zoneK) - x(seeds)) < 48 ? y1 + 22 : y1 + 10;
  const order = lines.map((_, i) => i).reverse(); // draw the main line on top

  return (
    <div ref={ref} className="gap-chart">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Smallest gap among the first k colors, for k from 2 to ${n}. ${lines
          .map((l) => `${l.label || "This palette"} ends at ${formatGap(l.values[n])}`)
          .join(". ")}.`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHover(null)}
      >
        <text className="chart-title" x={0} y={11}>
          Smallest gap among the first k colors
        </text>
        {g.yTicks.map((v) => (
          <g key={v}>
            <line className={v === 0 ? "chart-axis" : "chart-grid"} x1={x0} x2={x1} y1={y(v)} y2={y(v)} />
            <text className="chart-tick" x={x0 - 6} y={y(v) + 3.5} textAnchor="end">
              {v === 0 ? "0" : v.toFixed(g.digits)}
            </text>
          </g>
        ))}
        {g.xTicks.map((t) => (
          <g key={t}>
            <line className="chart-axis" x1={x(t)} x2={x(t)} y1={y0} y2={y0 + 4} />
            <text className="chart-tick" x={x(t)} y={y0 + 16} textAnchor="middle">
              {t}
            </text>
          </g>
        ))}
        <text className="chart-title" x={x1} y={HEIGHT - 4} textAnchor="end">
          Number of colors, k
        </text>

        {showSeeds && <line className="chart-seeds" x1={x(seeds)} x2={x(seeds)} y1={y1} y2={y0} />}
        {showZone && <line className="chart-seeds" x1={x(zoneK)} x2={x(zoneK)} y1={y1} y2={y0} />}
        <line className="chart-ref" x1={x0} x2={x1} y1={y(JUST_NOTICEABLE)} y2={y(JUST_NOTICEABLE)} />

        {order.map((i) => (
          <g key={i} className={lines[i].compare ? "series compare" : "series"}>
            <path d={g.paths[i]} />
            {n >= 2 && <circle cx={x(n)} cy={y(lines[i].values[n])} r={lines[i].compare ? 2.5 : 3} />}
          </g>
        ))}

        {/* Labels go on top, their halo keeps them readable over the lines */}
        <text className="chart-note" x={g.refLabel.x} y={g.refLabel.y} textAnchor={g.refLabel.anchor}>
          just noticeable
        </text>
        {showSeeds && (
          <text
            className="chart-note"
            x={seedsLeft ? x(seeds) - 4 : x(seeds) + 4}
            y={y1 + 10}
            textAnchor={seedsLeft ? "end" : "start"}
          >
            seeds
          </text>
        )}
        {showZone && (
          <text
            className="chart-note"
            x={zoneRight ? x(zoneK) + 4 : x(zoneK) - 4}
            y={zoneY}
            textAnchor={zoneRight ? "start" : "end"}
          >
            end zone
          </text>
        )}

        {hover !== null && (
          <g className="chart-hover">
            <line x1={x(k)} x2={x(k)} y1={y1} y2={y0} />
            {order.map((i) => (
              <circle key={i} className={lines[i].compare ? "compare" : undefined} cx={x(k)} cy={y(lines[i].values[k])} r={3.5} />
            ))}
          </g>
        )}
      </svg>
      <p className="readout">{readout}</p>
    </div>
  );
}

function LegendLine({ compare }: { compare?: boolean }) {
  return (
    <svg className={compare ? "series compare" : "series"} width="22" height="8" aria-hidden="true">
      <path d="M1,4H21" />
    </svg>
  );
}

/**
 * How distinct the colors are: the smallest and typical gaps, near duplicates and how
 * the smallest gap shrinks as colors are added, optionally against a comparison palette.
 * @param label name of the main palette in the legend, when there is a comparison
 * @param seeds number of leading colors that were given, marked on the chart
 * @param endZone index of the first color from the end zone, marked on the chart; -1 for none
 */
export function Quality({
  colors,
  ms,
  label = "",
  comparison,
  seeds = 0,
  endZone = -1,
}: {
  colors: string[];
  ms: number;
  label?: string;
  comparison?: Comparison;
  seeds?: number;
  endZone?: number;
}) {
  const q = useMemo(() => quality(colors), [colors]);
  const otherColors = comparison?.colors;
  const other = useMemo(() => otherColors && quality(otherColors), [otherColors]);
  const otherLabel = comparison?.label ?? "";
  const lines = useMemo<Line[]>(
    () => [
      { label, values: q.prefixMin },
      ...(other ? [{ label: otherLabel, values: other.prefixMin, compare: true }] : []),
    ],
    [q, other, label, otherLabel],
  );

  return (
    <section className="quality" aria-label="Quality">
      <h3>Quality</h3>
      <dl className="stats">
        <div title="Distance between the two most similar colors">
          <dt>Smallest gap</dt>
          <dd>
            {formatGap(q.minGap)}
            {q.closest &&
              q.closest.map((i) => (
                <span key={i} className="chip" style={{ background: colors[i] }} title={`Color ${i + 1}, ${colors[i]}`} />
              ))}
            {q.closest && (
              <small>
                {q.closest[0] + 1} and {q.closest[1] + 1}
              </small>
            )}
          </dd>
        </div>
        <div title="Median distance from each color to its most similar color">
          <dt>Typical gap</dt>
          <dd>{formatGap(q.medianNN)}</dd>
        </div>
        <div title={`Colors closer than ${JUST_NOTICEABLE} to another color`}>
          <dt>Near duplicates</dt>
          <dd data-warn={q.nearDuplicates > 0 || undefined}>{q.nearDuplicates}</dd>
        </div>
        <div title="Time the library call took in this browser">
          <dt>Generated in</dt>
          <dd>{formatMs(ms)}</dd>
        </div>
      </dl>

      {comparison && (
        <ul className="legend">
          <li>
            <LegendLine />
            {label} <span>{formatMs(ms)}</span>
          </li>
          <li>
            <LegendLine compare />
            {comparison.label} <span>{formatMs(comparison.ms)}</span>
          </li>
        </ul>
      )}

      {colors.length >= 2 ? (
        <GapChart lines={lines} seeds={seeds} endZone={endZone} />
      ) : (
        <p className="readout">Pick at least two colors to measure the gaps between them.</p>
      )}

      <p className="quality-note">
        Gaps are distances in OKLab. About {JUST_NOTICEABLE} is just noticeable; categories are easiest to tell apart
        at {DISTINCT} or more.
      </p>
    </section>
  );
}
