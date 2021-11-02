import * as d3 from "d3";
import type { ColorProps } from "./ColorLinear";
import { Box } from "@chakra-ui/react";

// width = 640, // outer width, in pixels
// height = 400, // outer height, in pixels
// innerRadius = Math.min(width, height) / 3, // inner radius of pie, in pixels (non-zero for donut)
// outerRadius = Math.min(width, height) / 2, // outer radius of pie, in pixels

const gradientStops = d3.range(100);

export default function ColorWheel({
  colors,
  scheme,
  animate = true,
}: ColorProps) {
  // Construct scales.
  // const color = d3.scaleOrdinal(names, colors);

  const innerRadius = 200;
  const outerRadius = 250;
  const midPoint = (outerRadius + innerRadius) / 2;
  const padAngle = 0;

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
    <Box>
      <svg
        viewBox="0 0 500 500"
        width="500"
        height="500"
        style={{ marginTop: "2em" }}
      >
        <g
          strokeWidth={0}
          transform={`translate(${outerRadius},${outerRadius})`}
        >
          {arcs.map((value, i) => (
            <path
              key={i}
              d={arc(value as any) as string}
              fill={scheme(i / gradientStops.length)}
            />
          ))}
          {colors.map((c, i) => (
            <g key={i}>
              {i + 1 < colors.length && (
                <line
                  x1={midPoint * Math.cos(θ(c.start))}
                  y1={midPoint * Math.sin(θ(c.start))}
                  x2={midPoint * Math.cos(θ(colors[i + 1].start))}
                  y2={midPoint * Math.sin(θ(colors[i + 1].start))}
                  strokeWidth={1}
                  stroke={lineColor(c.start)}
                />
              )}
              <circle
                cx={midPoint * Math.cos(θ(c.start))}
                cy={midPoint * Math.sin(θ(c.start))}
                r={25}
                fill={scheme(c.start)}
                stroke="white"
                strokeWidth={2}
              />
              <text
                x={midPoint * Math.cos(θ(c.start))}
                y={midPoint * Math.sin(θ(c.start))}
                textAnchor="middle"
                fill="white"
                fontWeight="bold"
                dy="0.3em"
              >
                {i + 1}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </Box>
  );
}
