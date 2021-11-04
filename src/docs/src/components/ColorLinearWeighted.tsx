import { motion } from "framer-motion";
import LinearGradient from "./LinearGradient";
import * as d3 from "d3";
import type { ColorProps } from "./ColorLinear";
import { getMargin } from "../utils/renderUtils";
import type { Margin } from "../utils/renderUtils";

export default function ColorLinearWeighted({
  numColors,
  scheme,
  animate = false,
  width = 500,
  height = 500,
  margin = undefined,
}: ColorProps) {
  margin = getMargin(margin);
  const totalWidth = width;
  const totalHeight = height;
  width -= margin.left + margin.right;
  height -= margin.top + margin.bottom;

  // const duration = (animate ? 3 : 0) / intervals.length;
  // const { length } = intervals;
  const numColorsToFit = 2 ** Math.ceil(Math.log2(numColors));
  const widthPerCircle = width / numColorsToFit - 2;
  const heightPerCircle = height / numColorsToFit - 2;
  const radiusSpacePerCircle = Math.min(
    widthPerCircle / 2,
    heightPerCircle / 2,
  );
  const minMargin = Math.min(
    margin.top,
    margin.bottom,
    margin.right,
    margin.left,
  );
  const circleRadius = Math.min(minMargin, radiusSpacePerCircle);
  const labelFontSize = Math.min(16, radiusSpacePerCircle);
  const labelStrokeWidth = radiusSpacePerCircle < 5 ? 0 : 2;
  const circleWhiteStrokeWidth = radiusSpacePerCircle < 5 ? 1 : 2;
  const circleGrayStrokeWidth = radiusSpacePerCircle < 5 ? 2 : 4;

  const radius = circleRadius;

  const x = d3.scaleLinear().domain([0, 1]).range([0, width]);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={totalWidth}
        height={totalHeight}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          <LinearGradient
            interval={{ start: 0, end: 1 }}
            x={x}
            scheme={scheme}
            y={0}
            height={40}
          />
          {/* {intervals.map((color, i) => (
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
                  fill:
                    i > 1
                      ? scheme(intervals[i - 1].start)
                      : scheme(color.start),
                  cx: i > 1 ? intervals[i - 1].start : 0,
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
          ))} */}
        </g>
      </svg>
    </div>
  );
}
