import { range, scaleLinear, interpolateRgb } from "d3";
import type { Interval } from "@mapequation/c3";

export type GradientProps = {
  interval: Interval;
  x: (t: number) => number;
  scheme: (t: number) => string;
  y: number;
  height: number;
  padX?: number;
  smooth?: boolean;
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
  const numStops = 20;
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
  smooth = true,
}: GradientProps) {
  padX ??= 0;
  const tDiff = interval.end - interval.start;
  const x0 = x(interval.start);
  const x1 = x(interval.end);
  const dx = x1 - x0;
  const numPixelsPerRect = 1;
  const numRects = Math.ceil(dx / numPixelsPerRect);
  const dt = tDiff / numRects;
  const rects = range(numRects).map((i) => {
    const t = interval.start + i * dt;
    const smoothStep = Math.min(i, numRects - i, 3);
    return {
      i,
      t,
      x: x(t),
      width: x(dt),
      color: smooth
        ? interpolateRgb(
            scheme(Math.max(0, t - smoothStep * dt)),
            scheme(Math.min(1, t + smoothStep * dt)),
          )(0.5)
        : scheme(t),
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
            fill={rect.color}
          />
        ))}
      </g>
    </g>
  );
}
