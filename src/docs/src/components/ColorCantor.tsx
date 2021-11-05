import { motion } from "framer-motion";
import LinearGradient from "./LinearGradient";
import * as d3 from "d3";
import type { ColorProps } from "./ColorLinear";
import { getMargin } from "../utils/renderUtils";
import { Node, Interval } from "@mapequation/c3";

type CantorRow = {
  intervals: Interval[];
  level: number;
  subLevel: number;
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
  const labelFontSize = Math.min(16, radiusSpacePerCircle);
  const labelStrokeWidth = radiusSpacePerCircle < 5 ? 0 : 2;
  const circleWhiteStrokeWidth = radiusSpacePerCircle < 5 ? 1 : 2;
  const circleGrayStrokeWidth = radiusSpacePerCircle < 5 ? 2 : 4;

  const x = d3.scaleLinear().domain([0, 1]).range([0, width]);

  const toInterval = ({ start, end }: Node) => ({ start, end } as Interval);

  const numLevels = Math.ceil(Math.log2(numColors));
  const intervals = [new Node(0, 1)];
  const cantorSet: CantorRow[] = [
    { intervals: intervals.map(toInterval), level: 0, split: 0, subLevel: 0 },
  ];

  for (let i = 0; i < numLevels; ++i) {
    const length = intervals.length;
    for (let j = 0; j < length; ++j) {
      const parent = intervals[j]!;
      const split = parent.mid;
      const child = parent.split();
      intervals.push(child);
      cantorSet.push({
        intervals: intervals.map(toInterval),
        level: i + 1,
        subLevel: j,
        split,
      });
      if (intervals.length === numColors) {
        break;
      }
    }
  }

  const padTop = 0;
  const padBottom = 5;
  const heightForCantor = height - padTop - padBottom;
  const heightPerLevel = heightForCantor / (numLevels + 1);
  const getSubY = ({ level, subLevel }: CantorRow) =>
    heightPerLevel * (level + subLevel / 2 ** Math.max(0, level - 1));
  const lineHeight = 4;
  const padX = Math.min(6, radiusSpacePerCircle);
  const circleRadius = Math.min(6, radiusSpacePerCircle);

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
            height={height}
            padX={0}
          />
          <g transform={`translate(0,${padTop})`}>
            {cantorSet.map((cantorRow, i) => (
              <g key={i}>
                {cantorRow.intervals.map((interval, j) => (
                  <g key={j}>
                    <Rect
                      x={x(interval.start) + padX}
                      y={getSubY(cantorRow)}
                      width={x(interval.end - interval.start) - 2 * padX}
                      height={lineHeight}
                    />
                    {i < numCirclesToShow && (
                      <g
                        transform={`translate(${x(cantorRow.split)},${
                          getSubY(cantorRow) + lineHeight / 2
                        })`}
                      >
                        {i + 1 < numCirclesToShow && (
                          // <line
                          //   x1={0}
                          //   x2={x(cantorSet[i + 1].split) - x(cantorRow.split)}
                          //   y1={0}
                          //   y2={getSubY(cantorSet[i + 1]) - getSubY(cantorRow)}
                          //   stroke="white"
                          //   strokeWidth={1}
                          // />
                          <g>
                            <path
                              shapeRendering="geometricPrecision"
                              d={`M 0 0 Q ${
                                (x(cantorSet[i + 1].split) -
                                  x(cantorRow.split)) /
                                2
                              } 0 ${
                                x(cantorSet[i + 1].split) - x(cantorRow.split)
                              } ${
                                getSubY(cantorSet[i + 1]) - getSubY(cantorRow)
                              }`}
                              fill="none"
                              stroke="black"
                              strokeWidth={2}
                            />
                            <path
                              shapeRendering="geometricPrecision"
                              d={`M 0 0 Q ${
                                (x(cantorSet[i + 1].split) -
                                  x(cantorRow.split)) /
                                2
                              } 0 ${
                                x(cantorSet[i + 1].split) - x(cantorRow.split)
                              } ${
                                getSubY(cantorSet[i + 1]) - getSubY(cantorRow)
                              }`}
                              fill="none"
                              stroke="white"
                              strokeWidth={1}
                            />
                          </g>
                        )}
                        <circle r={circleRadius} fill="black" strokeWidth={2} />
                        <circle
                          r={circleRadius - 2}
                          fill={scheme(cantorRow.split)}
                          stroke="white"
                          strokeWidth={2}
                        />
                      </g>
                    )}
                  </g>
                ))}
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
