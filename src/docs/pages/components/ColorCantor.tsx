import { motion } from "framer-motion";
import LinearGradient from "./LinearGradient";
import * as d3 from "d3";
import type { ColorProps } from "./ColorLinear";
import { getMargin } from "../utils/renderUtils";
import { Node, Interval } from "@mapequation/c3";

type CantorRow = {
  intervals: Interval[];
  level: number;
  split: number;
};

type RectProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
};
function Rect({ x, y, width, height, fill = "black" }: RectProps) {
  return width <= 0 ? null : (
    <rect x={x} y={y} width={width} height={height} fill={fill} />
  );
}

export default function ColorCantor({
  numColors,
  scheme,
  animate = false,
  width = 500,
  height = 500,
  margin = undefined,
}: ColorProps) {
  margin = getMargin(margin, { top: 10, bottom: 10, left: 10, right: 10 });
  const totalWidth = width;
  const totalHeight = height;
  width -= margin.left + margin.right;
  height -= margin.top + margin.bottom;
  console.log(margin, width, height);

  let numCirclesToShow = numColors;
  numColors = 16;
  numCirclesToShow = Math.min(numColors, numCirclesToShow);
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

  const toInterval = ({ start, end }: Node) => ({ start, end } as Interval);

  const numLoops = Math.ceil(Math.log2(numColors));
  const intervals = [new Node(0, 1)];
  const cantorSet: CantorRow[] = [
    { intervals: intervals.map(toInterval), level: 0, split: 0 },
  ];

  for (let i = 0; i < numLoops; ++i) {
    const length = intervals.length;
    for (let j = 0; j < length; ++j) {
      const parent = intervals[j]!;
      const split = parent.mid;
      const child = parent.split();
      intervals.push(child);
      cantorSet.push({
        intervals: intervals.map(toInterval),
        level: i + 1,
        split,
      });
      if (intervals.length === numColors) {
        break;
      }
    }
  }

  const y = d3.scaleLinear().domain([0, numColors]).range([0, height]);
  const rowHeight = 5;
  const padX = 5;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={totalWidth}
        height={totalHeight}
      >
        <g transform={`translate(${margin.left}px,${margin.top}px)`}>
          <LinearGradient
            interval={{ start: 0, end: 1 }}
            x={x}
            scheme={scheme}
            y={0}
            height={height}
            padX={0}
          />
          {cantorSet.map((cantorRow, i) => (
            <g key={i}>
              {cantorRow.intervals.map((interval, j) => (
                <g key={j}>
                  <Rect
                    x={x(interval.start) + padX}
                    y={y(i)}
                    width={x(interval.end - interval.start) - 2 * padX}
                    height={rowHeight}
                  />
                  {i < numCirclesToShow && (
                    <g>
                      {i > 0 && (
                        <line
                          x1={x(cantorSet[i - 1].split)}
                          x2={x(cantorRow.split)}
                          y1={y(i - 1) + padX / 2}
                          y2={y(i) + padX / 2}
                          stroke="white"
                          strokeWidth={0.5}
                        />
                      )}
                      <circle
                        cx={x(cantorRow.split)}
                        cy={y(i) + padX / 2}
                        r={padX}
                        fill={scheme(cantorRow.split)}
                        stroke="white"
                      />
                    </g>
                  )}
                </g>
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
