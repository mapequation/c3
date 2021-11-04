import { motion } from "framer-motion";
import { Interval } from "@mapequation/c3";
import { sum } from "d3";

export type ColorProps = {
  intervals: Interval[];
  scheme: (n: number) => string;
  weights?: number[];
  animate?: boolean;
};

export default function ColorBar({
  intervals = [],
  scheme,
  weights = undefined,
  animate = false,
}: ColorProps) {
  const duration = (animate ? 3 : 0) / intervals.length;
  const { length } = intervals;
  if (weights === undefined) {
    weights = new Array(length).fill(1);
  }
  const sumWeight = sum(weights);
  if (Math.abs(sumWeight - 1) > 1e-6) {
    weights = weights.map((w) => w / sumWeight);
  }

  return (
    <div>
      {intervals.map((color, i) => (
        <motion.div
          key={i}
          style={{
            display: "inline-block",
            width: `${weights![i] * 500}px`,
            height: "50px",
            background: scheme(color.start),
            boxSizing: "border-box",
            border: "solid 1px #333",
            borderLeft: i > 0 ? "none" : "solid 1px #333",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration, delay: i * duration }}
        />
      ))}
    </div>
  );
}
