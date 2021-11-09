import { range, scaleLinear } from "d3";
import type { Interval } from "@mapequation/c3";

export type GradientProps = {
  interval: Interval;
  x: (t: number) => number;
  scheme: (t: number) => string;
  y: number;
  height: number;
  padX?: number;
};

let elementCounter = 0;

export function LinearSVGGradient({
  interval,
  x,
  scheme,
  y,
  height,
  padX = 0,
}: GradientProps) {
  const dt = interval.end - interval.start;
  const x0 = x(interval.start) + padX;
  const x1 = x(interval.end) - padX;
  const width = x1 - x0;
  const numStops = Math.ceil(width / 50) + 1;
  const gradientId = `gradient${elementCounter++}`;
  return x0 >= x1 ? null : (
    <g>
      <defs>
        <linearGradient id={gradientId}>
          {range(numStops).map((stop) => (
            <stop
              key={stop}
              offset={`${stop / (numStops - 1)}`}
              stopColor={scheme(interval.start + (stop / (numStops - 1)) * dt)}
            />
          ))}
        </linearGradient>
      </defs>
      <rect
        x={x0}
        y={y}
        width={width}
        height={height}
        fill={`url('#${gradientId}')`}
      />
    </g>
  );
}

export default function LinearGradient({
  interval,
  x,
  scheme,
  y,
  height,
  padX = 0,
}: GradientProps) {
  padX ??= 0;
  const dt = interval.end - interval.start;
  const x0 = x(interval.start);
  const x1 = x(interval.end);
  const dx = x1 - x0;
  const numPixelsPerRect = 1;
  const numRects = Math.ceil(dx / numPixelsPerRect);
  const rects = range(numRects).map((i) => {
    const t = interval.start + (i / numRects) * dt;
    return {
      i,
      t,
      x: x(t),
      width: x(dt / numRects),
    };
  });
  const clipId = `${elementCounter++}`;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x0 + padX} y={y} width={dx - 2 * padX} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {rects.map((rect) => (
          <rect
            key={rect.i}
            x={rect.x}
            y={y}
            width={rect.width}
            height={height}
            fill={scheme(rect.t)}
          />
        ))}
      </g>
    </g>
  );
}
