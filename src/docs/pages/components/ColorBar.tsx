import { motion } from "framer-motion";
import { Node } from "@mapequation/c3";

export type ColorProps = {
  colors: Node[];
  scheme: (n: number) => string;
  animate?: boolean;
};

export default function ColorBar({
  colors = [],
  scheme,
  animate = false,
}: ColorProps) {
  const duration = (animate ? 3 : 0) / colors.length;
  const { length } = colors;

  return (
    <div>
      {colors.map((color, i) => (
        <motion.div
          key={i}
          style={{
            display: "inline-block",
            width: `${(1 / length) * 500}px`,
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
