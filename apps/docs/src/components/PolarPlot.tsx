import { useMemo } from "react";
import { oklch, type Region } from "@mapequation/c3";
import { delegatedHover, NONE, type Hover } from "./Hover";

const SIZE = 320;
const R = SIZE / 2 - 16;
// Hue labels sit inside the rim, next to their axis
const HUE_LABELS = [
  { h: 0, x: R - 4, y: -5, anchor: "end" },
  { h: 90, x: 5, y: -R + 12, anchor: "start" },
  { h: 180, x: -R + 4, y: -5, anchor: "start" },
  { h: 270, x: 5, y: R - 6, anchor: "start" },
] as const;
const HUE_STEPS = 72;

// OKLCH hue counterclockwise from the right, like a color wheel
const point = (hue: number, r: number) => {
  const a = (hue * Math.PI) / 180;
  return [r * Math.cos(a), -r * Math.sin(a)] as const;
};

/** Outline of the chroma range the region allows at each hue */
function regionPath({ chroma: [lo, hi], warmHue, tilt }: Region, scale: (c: number) => number) {
  const hues = Array.from({ length: HUE_STEPS + 1 }, (_, i) => (360 * i) / HUE_STEPS);
  const outer = hues.map((h) => {
    const warmth = (1 + Math.cos(((h - warmHue) * Math.PI) / 180)) / 2;
    return point(h, scale(lo + (hi - lo) * (1 - tilt + tilt * warmth)));
  });
  const inner = hues.map((h) => point(h, scale(lo))).reverse();
  return `M${outer.join("L")}ZM${inner.join("L")}Z`;
}

/**
 * Colors placed by OKLCH hue (angle) and chroma (distance from the center).
 * Hovering a dot highlights its color in the other views; hovered colors get a ring.
 * @param seeds number of leading colors to mark as seeds
 */
export function PolarPlot({
  colors,
  region,
  seeds = 0,
  hovered = NONE,
  onHover,
}: { colors: string[]; region: Region; seeds?: number } & Partial<Hover>) {
  // Everything but the highlight, so hovering does not redraw the plot
  const plot = useMemo(() => {
    const lch = colors.map(oklch);
    const top = Math.max(0.1, region.chroma[1], ...lch.map(([, C]) => C));
    const max = Math.ceil(top / 0.05) * 0.05;
    const scale = (c: number) => (c / max) * R;
    const rings = Array.from({ length: Math.round(max / 0.05) }, (_, i) => (i + 1) * 0.05);
    const dot = Math.max(3.5, Math.min(8, 32 / Math.sqrt(colors.length)));
    const xy = lch.map(([, C, H]) => point(H, scale(C)));
    const radius = (i: number) => (i < seeds ? dot + 1.5 : dot);
    const dotClass = (i: number) => (i < seeds ? "polar-dot seed" : "polar-dot");
    const order = colors.map((_, i) => i).reverse(); // draw the first colors on top

    const content = (
      <>
        {Array.from({ length: HUE_STEPS }, (_, i) => {
          const h0 = (360 * i) / HUE_STEPS;
          const h1 = h0 + 360 / HUE_STEPS + 0.5;
          const [a, b, c, d] = [point(h0, R + 4), point(h1, R + 4), point(h1, R + 12), point(h0, R + 12)];
          return <path key={i} d={`M${a}L${b}L${c}L${d}Z`} style={{ fill: `oklch(0.75 0.12 ${h0 + 180 / HUE_STEPS})` }} />;
        })}
        {rings.map((c) => (
          <circle key={c} className="polar-grid" r={scale(c)} />
        ))}
        {HUE_LABELS.map(({ h, x, y, anchor }) => {
          const [x2, y2] = point(h, R);
          return (
            <g key={h}>
              <line className="polar-grid" x1={0} y1={0} x2={x2} y2={y2} />
              <text className="polar-label" x={x} y={y} textAnchor={anchor}>
                {h}°
              </text>
            </g>
          );
        })}
        {rings.map((c) => (
          <text key={c} className="polar-label small" x={scale(c) - 3} y={11} textAnchor="end">
            {+c.toFixed(2)}
          </text>
        ))}
        <path className="polar-region" d={regionPath(region, scale)} fillRule="evenodd" />
        {order.map((i) => (
          <circle key={i} data-i={i} cx={xy[i][0]} cy={xy[i][1]} r={radius(i)} fill={colors[i]} className={dotClass(i)}>
            <title>{`${i + 1}${i < seeds ? " (seed)" : ""} ${colors[i]}`}</title>
          </circle>
        ))}
      </>
    );
    return { content, xy, radius, dotClass };
  }, [colors, region, seeds]);

  return (
    <svg
      className="polar"
      viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`${colors.length} colors by OKLCH hue and chroma`}
      {...(onHover && delegatedHover(onHover))}
    >
      {plot.content}
      {/* Hovered dots again on top, so they show even under other dots */}
      {hovered
        .filter((i) => i < colors.length)
        .map((i) => {
          const [cx, cy] = plot.xy[i];
          return (
            <g key={i} pointerEvents="none">
              <circle cx={cx} cy={cy} r={plot.radius(i)} fill={colors[i]} className={plot.dotClass(i)} />
              <circle className="ring hover" cx={cx} cy={cy} r={plot.radius(i) + 3} />
            </g>
          );
        })}
    </svg>
  );
}
