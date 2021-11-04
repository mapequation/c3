import { motion } from "framer-motion";
import type { Interval } from "@mapequation/c3";
import { range } from "d3";

export type ColorProps = {
  intervals: Interval[];
  scheme: (n: number) => string;
  animate?: boolean;
};

const gradientStops = range(200);

export default function ColorLinear({
  intervals,
  scheme,
  animate = true,
}: ColorProps) {
  const duration = (animate ? 3 : 0) / intervals.length;
  const { length } = intervals;
  const radius = 0.5 / length;

  return (
    <div>
      <svg
        viewBox="0 0 1 1"
        width="500"
        height="500"
        style={{ marginTop: "2em" }}
      >
        {gradientStops.map((i) => (
          <rect
            key={i}
            x={i / gradientStops.length}
            y={0}
            width={1 / gradientStops.length}
            height={1}
            fill={scheme(i / gradientStops.length)}
          />
        ))}

        {intervals.map((color, i) => (
          <g key={i} strokeWidth={0.1 / length}>
            {i + 1 < length && (
              <motion.line
                stroke="white"
                x1={intervals[i].start}
                initial={{
                  x2: intervals[i].start,
                  y1: i / length,
                  y2: i / length,
                  opacity: 0,
                }}
                animate={{
                  x2: intervals[i + 1].start,
                  opacity: 1,
                  y1: i / length,
                  y2: (i + 1) / length,
                }}
                transition={{ duration, delay: (i + 1) * duration }}
              />
            )}
            <motion.circle
              r={radius}
              stroke="white"
              initial={{
                fill: i > 1 ? scheme(colors[i - 1].start) : scheme(color.start),
                cx: i > 1 ? colors[i - 1].start : 0,
                cy: i > 1 ? (i - 1) / length : 0,
                opacity: 0,
              }}
              animate={{
                fill: scheme(color.start),
                cx: color.start,
                cy: i / length,
                opacity: 1,
              }}
              transition={{ duration, delay: i * duration }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

ColorLinear.getInitialProps = function () {
  return {
    colors: [],
    scheme: () => "red",
  };
};
