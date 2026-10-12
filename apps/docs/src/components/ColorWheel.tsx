import type { Interval } from "@mapequation/c3";
import { inkOn } from "../util";

const SIZE = 300;
const R = SIZE / 2 - 10;
const R0 = R * 0.9;
const MID = (R + R0) / 2;

const point = (t: number, r = MID) => {
  const a = 2 * Math.PI * t - Math.PI / 2;
  return [r * Math.cos(a), r * Math.sin(a)] as const;
};

function arc(t0: number, t1: number) {
  const [a, b] = [point(t0, R), point(t1, R)];
  const [c, d] = [point(t1, R0), point(t0, R0)];
  return `M${a}A${R} ${R} 0 0 1 ${b}L${c}A${R0} ${R0} 0 0 0 ${d}Z`;
}

/**
 * The scheme around a circle with the color stops in order.
 * @param ring scheme colors sampled evenly around the circle
 */
export function ColorWheel({ stops, colors, ring }: { stops: Interval[]; colors: string[]; ring: string[] }) {
  const fit = 2 ** Math.ceil(Math.log2(Math.max(1, stops.length)));
  const radius = Math.max(1.5, Math.min((R - R0) * 0.8, (MID * Math.PI) / fit - 2));
  const step = 1 / ring.length;

  return (
    <svg
      className="wheel"
      viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`Color wheel with ${stops.length} color stops`}
    >
      {ring.map((c, k) => (
        // Overlap the segments a little to hide anti-aliasing seams
        <path key={k} d={arc(k * step, (k + 1) * step + 0.002)} fill={c} />
      ))}
      <circle className="wheel-edge" r={R} />
      <circle className="wheel-edge" r={R0} />
      <polyline className="wheel-path" strokeWidth={Math.max(0.3, Math.min(1, 32 / stops.length))} points={stops.map((s) => point(s.start).join(",")).join(" ")} />
      {stops.map((s, i) => {
        const [x, y] = point(s.start);
        return (
          <g key={i}>
            <circle className="wheel-dot" cx={x} cy={y} r={radius} fill={colors[i]} />
            {radius >= 7 && (
              <text x={x} y={y} dy="0.35em" fontSize={Math.min(11, radius)} fill={inkOn(colors[i])}>
                {i + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
