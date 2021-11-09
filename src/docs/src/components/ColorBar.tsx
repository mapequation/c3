import { motion } from "framer-motion";
import { Interval } from "@mapequation/c3";
import { sum } from "d3";

export type ColorProps = {
  intervals: Interval[];
  scheme: (n: number) => string;
  weights?: number[];
  animate?: boolean;
  width?: number;
  height?: number;
};

export default function ColorBar({
  intervals = [],
  scheme,
  weights = undefined,
  width = 400,
  height = 50,
}: ColorProps) {
  const { length } = intervals;
  const totalWeight = sum(weights ?? [1]);
  const weight = (i: number) =>
    weights ? weights[i] / totalWeight : 1 / length;

  return (
    <div>
      {intervals.map(({ start }, i) => (
        <div
          key={i}
          style={{
            display: "inline-block",
            width: `${weight(i) * width}px`,
            height: `${height}px`,
            background: scheme(start),
            boxSizing: "border-box",
            borderTop: "1px solid #999",
            borderBottom: "1px solid #999",
            borderLeft: i === 0 ? "1px solid #999" : "none",
            borderRight: i + 1 === length ? "1px solid #999" : "none",
          }}
        />
      ))}
    </div>
  );
}
