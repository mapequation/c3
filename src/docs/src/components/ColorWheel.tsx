import * as d3 from "d3";
import { Interval } from "@mapequation/c3";

type ColorProps = {
  intervals: Interval[];
  scheme: (n: number) => string;
  animate?: boolean;
  size?: number; // outer diameter
  hole?: number; // hole proportion as inner to outer diameter
  margin?: number; // margin outside outer diameter
};

const gradientStops = d3.range(100);

export default function ColorWheel({
  intervals,
  scheme,
  animate = true,
  size = 500,
  hole = 0.9,
  margin = 10,
}: ColorProps) {
  const diameter = size - 2 * margin;
  const outerRadius = diameter / 2;
  const innerRadius = outerRadius * hole;
  const donutWidth = outerRadius - innerRadius;
  const midPoint = (outerRadius + innerRadius) / 2;
  const padAngle = 0;
  const numColorsToFit = 2 ** Math.ceil(Math.log2(intervals.length));
  const radiusSpacePerCircle = (1 * (midPoint * Math.PI)) / numColorsToFit - 2;
  const circleRadius = Math.min(donutWidth * 0.8, radiusSpacePerCircle);
  const labelFontSize = Math.min(16, radiusSpacePerCircle);
  const labelStrokeWidth = radiusSpacePerCircle < 5 ? 0 : 2;
  const circleWhiteStrokeWidth = radiusSpacePerCircle < 5 ? 1 : 2;
  const circleGrayStrokeWidth = radiusSpacePerCircle < 5 ? 2 : 4;
  const lineStrokeWidth = radiusSpacePerCircle < 5 ? 2 : 3;

  const r = d3.scaleLinear().domain([0, 1]).range([0, midPoint]);

  const arcs = d3
    .pie()
    .padAngle(padAngle)
    .sort(null)
    .value(() => 1)(gradientStops);

  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  const θ = d3
    .scaleLinear()
    .domain([0, 1])
    .range([-Math.PI / 2, -Math.PI / 2 + Math.PI * 2]);

  const lineColor = d3.interpolateRgb("#000", "#eee");

  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <g transform={`translate(${margin},${margin})`}>
          <g
            strokeWidth={0}
            transform={`translate(${outerRadius},${outerRadius})`}
          >
            <circle r={outerRadius} stroke="#999" fill="none" strokeWidth={1} />
            <circle r={innerRadius} stroke="#999" fill="none" strokeWidth={1} />
            {arcs.map((value, i) => (
              <path
                key={i}
                d={arc(value as any) as string}
                fill={scheme(i / gradientStops.length)}
              />
            ))}
            {intervals.map((c, i) => (
              <g key={i}>
                {i + 1 < intervals.length && (
                  <>
                    <line
                      x1={r(Math.cos(θ(c.start)))}
                      y1={r(Math.sin(θ(c.start)))}
                      x2={r(Math.cos(θ(intervals[i + 1].start)))}
                      y2={r(Math.sin(θ(intervals[i + 1].start)))}
                      strokeWidth={lineStrokeWidth}
                      stroke="#777"
                    />
                    <line
                      x1={r(Math.cos(θ(c.start)))}
                      y1={r(Math.sin(θ(c.start)))}
                      x2={r(Math.cos(θ(intervals[i + 1].start)))}
                      y2={r(Math.sin(θ(intervals[i + 1].start)))}
                      strokeWidth={lineStrokeWidth - 1}
                      stroke="white"
                    />
                  </>
                )}
                <circle
                  cx={r(Math.cos(θ(c.start)))}
                  cy={r(Math.sin(θ(c.start)))}
                  r={circleRadius}
                  stroke="#777"
                  strokeWidth={circleGrayStrokeWidth}
                />
                <circle
                  cx={r(Math.cos(θ(c.start)))}
                  cy={r(Math.sin(θ(c.start)))}
                  r={circleRadius}
                  fill={scheme(c.start)}
                  stroke="white"
                  strokeWidth={circleWhiteStrokeWidth}
                />
                <text
                  x={r(Math.cos(θ(c.start)))}
                  y={r(Math.sin(θ(c.start)))}
                  textAnchor="middle"
                  fill="white"
                  stroke="#777"
                  paintOrder="stroke"
                  strokeWidth={labelStrokeWidth}
                  fontWeight="bold"
                  fontSize={labelFontSize}
                  dy="0.3em"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}

ColorWheel.getInitialProps = function () {
  return {
    intervals: [],
    scheme: () => "red",
  };
};
