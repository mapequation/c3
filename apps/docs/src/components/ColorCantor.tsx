import { useId } from "react";
import { Node, type Interval } from "@mapequation/c3";

const SIZE = 300;
const MARGIN = 10;
const WIDTH = SIZE - 2 * MARGIN;
const MAX_STOPS = 16;
const LEVELS = Math.ceil(Math.log2(MAX_STOPS));
const LEVEL_HEIGHT = (WIDTH - 5) / (LEVELS + 1);
const BAR = 4;
const PAD = 4;

type Row = { intervals: Interval[]; level: number; sub: number; split: number };

/** Split [0, 1] like stops() does, keeping every step as a row */
function cantorRows(weights: number[], strength: number) {
  const w = (i: number) => weights[Math.min(i, weights.length - 1)];
  const nodes = [new Node(0, 1, w(0), w(0))];
  const snapshot = () => nodes.map(({ start, end }) => ({ start, end }));
  const rows: Row[] = [{ intervals: snapshot(), level: 0, sub: 0, split: 0 }];
  for (let level = 1, k = 0; level <= LEVELS; ++level) {
    const count = nodes.length;
    for (let j = 0; j < count && nodes.length < MAX_STOPS; ++j) {
      const parent = nodes[j];
      nodes.push(parent.split(w(++k), strength));
      rows.push({ intervals: snapshot(), level, sub: j, split: parent.end });
    }
  }
  return rows;
}

const x = (t: number) => t * WIDTH;
const y = ({ level, sub }: Row) => LEVEL_HEIGHT * (level + sub / 2 ** Math.max(0, level - 1));

/**
 * How the first 16 color stops split the interval, on top of the scheme
 * as it looks at each depth (saturation and lightness change with depth).
 * @param levels scheme colors sampled evenly along [0, 1], one array per depth
 */
export function ColorCantor({
  weights,
  strength,
  colors,
  levels,
}: {
  weights: number[];
  strength: number;
  colors: string[];
  levels: string[][];
}) {
  const id = useId().replace(/[^\w-]/g, "");
  const rows = cantorRows(weights, strength);
  const shown = Math.min(colors.length, rows.length);

  return (
    <svg
      className="cantor"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Cantor diagram of how the first 16 color stops split the interval"
    >
      <defs>
        {levels.map((samples, i) => (
          <linearGradient key={i} id={`${id}-${i}`}>
            {samples.map((c, j) => (
              <stop key={j} offset={(j + 0.5) / samples.length} stopColor={c} />
            ))}
          </linearGradient>
        ))}
      </defs>
      <g transform={`translate(${MARGIN},${MARGIN})`}>
        {levels.map((_, i) => (
          <rect key={i} x={0} y={i * LEVEL_HEIGHT} width={WIDTH} height={LEVEL_HEIGHT} fill={`url(#${id}-${i})`} />
        ))}
        {rows.map((row, i) =>
          row.intervals.map(({ start, end }, j) => {
            const width = x(end - start) - 2 * PAD;
            return width > 0 && <rect key={`${i}-${j}`} className="cantor-bar" x={x(start) + PAD} y={y(row)} width={width} height={BAR} />;
          }),
        )}
        {rows.slice(0, shown).map((row, i) => {
          const next = i + 1 < shown ? rows[i + 1] : null;
          const dx = next ? x(next.split) - x(row.split) : 0;
          const dy = next ? y(next) - y(row) : 0;
          const curve = `M0 0Q${dx / 2} 0 ${dx} ${dy}`;
          return (
            <g key={i} transform={`translate(${x(row.split)},${y(row) + BAR / 2})`}>
              {next && (
                <>
                  <path className="cantor-link" d={curve} strokeWidth={2} />
                  <path className="cantor-link inner" d={curve} strokeWidth={1} />
                </>
              )}
              <circle r={6} className="cantor-dot" />
              <circle r={4} fill={colors[i]} className="cantor-fill" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
