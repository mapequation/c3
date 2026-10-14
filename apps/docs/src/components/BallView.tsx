import { useEffect, useMemo, useRef, useState } from "react";
import type { Tree } from "../tree";
import { formatGap } from "./Quality";
import { formatFlow } from "./Icicle";
import { JUST_NOTICEABLE } from "../quality";

type Props = {
  tree: Tree;
  selected: number | null;
  hovered: number | null;
  padding: number;
  onSelect: (i: number | null) => void;
  onHover: (i: number | null) => void;
};

/** The part of the a–b plane in view: its center and half its width */
type View = { a: number; b: number; span: number };

const SIZE = 320;
const R = SIZE / 2 - 8;
const RINGS = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35];
const AXES = [0, 90, 180, 270];

/** Glide between views, zooming evenly on a log scale */
function useTween(target: View, ms = 450) {
  const [view, setView] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    const done = from.a === target.a && from.b === target.b && from.span === target.span;
    if (done || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setView(target);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
      const span = from.span * (target.span / from.span) ** e;
      current.current = { a: from.a + (target.a - from.a) * e, b: from.b + (target.b - from.b) * e, span };
      setView(current.current);
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return view;
}

/**
 * OKLab's a–b plane from above, with each module's ball. Without a selection it
 * shows the top modules; with one it zooms in on the ball of the selected module
 * (or its parent, for a module without children) and shows the children inside.
 */
export function BallView({ tree, selected, hovered, padding, onSelect, onHover }: Props) {
  const { modules, keys, labs, parent, children, levels } = tree;
  const focus = selected === null ? null : children[selected].length > 0 ? selected : parent[selected] >= 0 ? parent[selected] : null;
  const inside = focus === null ? levels[0] : children[focus];
  const around = focus === null ? [] : levels[modules[focus].path.length - 1];

  const target = useMemo<View>(() => {
    if (focus !== null) return { a: labs[focus][1], b: labs[focus][2], span: Math.max(0.004, 1.6 * modules[focus].radius) };
    const reach = levels[0].reduce((r, i) => Math.max(r, Math.hypot(labs[i][1], labs[i][2]) + modules[i].radius), 0.1);
    return { a: 0, b: 0, span: 1.08 * reach };
  }, [focus, labs, levels, modules]);
  const view = useTween(target);
  const k = R / view.span;
  const x = (i: number) => (labs[i][1] - view.a) * k;
  const y = (i: number) => -(labs[i][2] - view.b) * k;
  const dot = Math.max(3, Math.min(7, 28 / Math.sqrt(inside.length)));

  // The neighbor that limits the focus ball: the smallest distance split by √flow
  const limit = useMemo(() => {
    if (focus === null) return null;
    const w = Math.sqrt(modules[focus].flow);
    let best: { j: number; dist: number; part: number; share: number } | null = null;
    for (const j of around) {
      if (j === focus) continue;
      const v = Math.sqrt(modules[j].flow);
      const part = w + v > 0 ? w / (w + v) : 0.5;
      const dist = Math.hypot(...labs[focus].map((c, n) => c - labs[j][n]));
      if (!best || dist * part < best.share) best = { j, dist, part, share: dist * part };
    }
    return best;
  }, [focus, around, modules, labs]);

  const ball = (i: number, className: string) =>
    modules[i].radius > 0 && (
      <circle
        key={`b${i}`}
        className={className}
        cx={x(i)}
        cy={y(i)}
        r={modules[i].radius * k}
        style={{ fill: modules[i].color, stroke: modules[i].color }}
        onClick={() => onSelect(i)}
      />
    );
  const point = (i: number, r: number, className: string) => (
    <circle
      key={`d${i}`}
      className={className}
      cx={x(i)}
      cy={y(i)}
      r={r}
      fill={modules[i].color}
      onClick={() => onSelect(i)}
      onPointerEnter={() => onHover(i)}
      onPointerLeave={() => onHover(null)}
    >
      <title>{`${keys[i]} ${modules[i].color}, flow ${formatFlow(modules[i].flow)}`}</title>
    </circle>
  );
  const ring = (i: number | null, r: number, className: string) =>
    i !== null && (inside.includes(i) || around.includes(i)) && <circle className={className} cx={x(i)} cy={y(i)} r={r} />;

  const crumbs: number[] = [];
  for (let i = selected ?? -1; i >= 0; i = parent[i]) crumbs.unshift(i);
  const scale = JUST_NOTICEABLE * k;
  const m = focus !== null ? modules[focus] : null;

  return (
    <div className="figures">
      <figure className="ball-figure">
        <nav className="crumbs" aria-label="Zoom level">
          {[null, ...crumbs].map((i, n) => (
            <span key={i ?? "all"}>
              {n > 0 && <span aria-hidden="true">›</span>}
              <button type="button" aria-current={i === selected || undefined} onClick={() => onSelect(i)}>
                {i === null ? "Top modules" : keys[i]}
              </button>
            </span>
          ))}
        </nav>
        <svg
          className="ball-view"
          viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
          role="img"
          aria-label={focus === null ? "Top modules and their balls in the OKLab a–b plane" : `The ball of module ${keys[focus]} and its children`}
        >
          <g className="polar-grid">
            {AXES.map((h) => (
              <line
                key={h}
                x1={-view.a * k}
                y1={view.b * k}
                x2={(Math.cos((h * Math.PI) / 180) * 0.5 - view.a) * k}
                y2={(view.b - Math.sin((h * Math.PI) / 180) * 0.5) * k}
              />
            ))}
            {RINGS.map((c) => (
              <circle key={c} cx={-view.a * k} cy={view.b * k} r={c * k} />
            ))}
          </g>
          {RINGS.map((c) => (
            <text key={c} className="polar-label small" x={(c - view.a) * k - 3} y={view.b * k + 11} textAnchor="end">
              {c}
            </text>
          ))}
          {around.map((i) => ball(i, i === focus ? "ball focus" : "ball context"))}
          {limit && <line className="ball-limit" x1={x(focus!)} y1={y(focus!)} x2={x(limit.j)} y2={y(limit.j)} />}
          {around.map((i) => i !== focus && point(i, dot, "ball-dot context"))}
          {inside.map((i) => ball(i, "ball"))}
          {inside.map((i) => point(i, dot, "ball-dot"))}
          {focus !== null && point(focus, dot + 2, "ball-dot")}
          {ring(focus, dot + 4.5, "ball-ring")}
          {selected !== focus && ring(selected, dot + 3, "ball-ring")}
          {ring(hovered, dot + 3, "ball-ring hover")}
          <g className="ball-scale" transform={`translate(${-SIZE / 2 + 12} ${SIZE / 2 - 12})`}>
            <line x1={0} x2={scale} />
            <text x={scale + 5} y={3.5}>
              {JUST_NOTICEABLE} just noticeable
            </text>
          </g>
        </svg>
        <figcaption>
          OKLab from above: hue as angle, chroma as distance from the center. Lightness, the third dimension, is not shown, so
          colors can look closer here than they are. Each module gets a ball whose radius splits the distance to its
          neighbors on the same level by the square root of their flows, minus the padding. Children are placed as far
          apart as possible inside their parent's ball, so they look related to their parent and distinct from each other.
        </figcaption>
      </figure>

      <div className="ball-notes" aria-live="polite">
        {m && focus !== null ? (
          <>
            <h3>
              <span className="chip" style={{ background: m.color }} />
              Module {keys[focus]}
            </h3>
            <dl>
              <dt>Flow</dt>
              <dd>{formatFlow(m.flow)}</dd>
              {limit ? (
                <>
                  <dt>Nearest share</dt>
                  <dd>
                    <span className="chip" style={{ background: modules[limit.j].color }} />
                    {keys[limit.j]} is {formatGap(limit.dist)} away. By √flow, {keys[focus]} gets{" "}
                    {Math.round(100 * limit.part)}% of that: {formatGap(limit.share)}.
                  </dd>
                </>
              ) : (
                <>
                  <dt>Nearest share</dt>
                  <dd>No other module on this level, so the share is 0.05.</dd>
                </>
              )}
              <dt>Ball radius</dt>
              <dd>
                {formatGap(m.radius)}, the share minus {Math.round(100 * padding)}% padding
              </dd>
              <dt>Children</dt>
              <dd>{children[focus].length}, each as far as possible from the ones before it, in path order</dd>
            </dl>
          </>
        ) : (
          <>
            <h3>Top modules</h3>
            <p>
              {levels[0].length} top modules get palette() colors, weighted by flow. The circles are their balls, where
              their children go.
            </p>
            <p>Click a module here or in the icicle chart to look into its ball.</p>
          </>
        )}
      </div>
    </div>
  );
}
