import { useEffect, useId, useMemo, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { useWidth } from "./Quality";
import { inkOn } from "../util";
import type { Tree } from "../tree";

type Props = {
  tree: Tree;
  selected: number | null;
  hovered: number | null;
  onSelect: (i: number | null) => void;
  onHover: (i: number | null) => void;
};

export const formatFlow = (flow: number) => String(+flow.toPrecision(3));

/** Each module's span of [0, 1], its share of its parent's span by flow */
function layout({ modules, children, levels }: Tree) {
  const x0 = new Float64Array(modules.length);
  const x1 = new Float64Array(modules.length);
  const place = (ids: number[], from: number, to: number) => {
    const total = ids.reduce((s, i) => s + modules[i].flow, 0);
    let x = from;
    for (const i of ids) {
      x0[i] = x;
      x += (to - from) * (total > 0 ? modules[i].flow / total : 1 / ids.length);
      x1[i] = x;
      place(children[i], x0[i], x1[i]);
    }
  };
  place(levels[0] ?? [], 0, 1);
  return { x0, x1 };
}

/** The whole tree, one row per level, drawn on a canvas so it handles thousands of modules */
export function Icicle({ tree, selected, hovered, onSelect, onHover }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>(800);
  const canvas = useRef<HTMLCanvasElement>(null);
  const readoutId = useId();
  const { x0, x1 } = useMemo(() => layout(tree), [tree]);
  const { modules, keys, levels, parent, children } = tree;
  const rowH = Math.max(14, Math.min(40, Math.floor(200 / levels.length)));
  const height = levels.length * rowH;

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = Math.round(width * dpr);
    el.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `11px ${getComputedStyle(el).getPropertyValue("--font-mono")}`;
    ctx.textBaseline = "middle";
    modules.forEach(({ color, path }, i) => {
      const [x, w, y] = [x0[i] * width, (x1[i] - x0[i]) * width, (path.length - 1) * rowH];
      ctx.fillStyle = color;
      // A pixel of space between rows and between modules wide enough to spare it
      ctx.fillRect(x, y, w >= 3 ? w - 1 : w, rowH - 1);
      if (w > 24 && rowH >= 18 && ctx.measureText(keys[i]).width + 8 <= w) {
        ctx.fillStyle = inkOn(color);
        ctx.fillText(keys[i], x + 4, y + rowH / 2);
      }
    });
  }, [modules, keys, x0, x1, width, height, rowH]);

  // The module under the pointer: binary search the row, which is sorted by position
  const at = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const row = levels[Math.floor((e.clientY - rect.top) / rowH)] ?? [];
    let [lo, hi, found] = [0, row.length - 1, -1];
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (x0[row[mid]] <= x) [found, lo] = [row[mid], mid + 1];
      else hi = mid - 1;
    }
    return found >= 0 && x < x1[found] ? found : null;
  };

  // Left and right along the level, up to the parent, down to the first child
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") return onSelect(null);
    if (!e.key.startsWith("Arrow")) return;
    e.preventDefault();
    if (selected === null) return onSelect(levels[0][0]);
    const row = levels[modules[selected].path.length - 1];
    const k = row.indexOf(selected);
    const next = {
      ArrowLeft: row[k - 1],
      ArrowRight: row[k + 1],
      ArrowUp: parent[selected],
      ArrowDown: children[selected][0],
    }[e.key];
    if (next !== undefined && next >= 0) onSelect(next);
  };

  const mark = (i: number | null, kind: string) =>
    i !== null && (
      <span
        className={`icicle-mark ${kind}`}
        style={{
          left: `${x0[i] * 100}%`,
          width: `${(x1[i] - x0[i]) * 100}%`,
          top: (modules[i].path.length - 1) * rowH,
          height: rowH - 1,
        }}
      />
    );

  const shown = hovered ?? selected;
  const m = shown !== null ? modules[shown] : null;

  return (
    <div className="icicle-panel">
      <div
        ref={ref}
        className="icicle"
        tabIndex={0}
        role="img"
        aria-label={`Icicle chart of ${modules.length} modules on ${levels.length} levels. Arrow keys move the selection.`}
        aria-describedby={readoutId}
        onPointerMove={(e) => onHover(at(e))}
        onPointerLeave={() => onHover(null)}
        onClick={(e) => {
          const i = at(e);
          if (i !== null) onSelect(i);
        }}
        onKeyDown={onKeyDown}
      >
        <canvas ref={canvas} style={{ height }} aria-hidden="true" />
        {mark(selected, "selected")}
        {hovered !== selected && mark(hovered, "hover")}
      </div>
      <p className="readout" id={readoutId} aria-live="polite">
        {m && shown !== null ? (
          <>
            <span className="chip" style={{ background: m.color }} />
            {`${keys[shown]}  flow ${formatFlow(m.flow)}  ${m.color}`}
            {children[shown].length > 0 && `  ${children[shown].length} children`}
          </>
        ) : (
          "Hover or focus a module to inspect it, click to select it."
        )}
      </p>
    </div>
  );
}
