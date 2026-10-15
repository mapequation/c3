import { useCallback, useState, type ReactNode, type SyntheticEvent } from "react";

/** Nothing highlighted */
export const NONE: readonly never[] = [];

/**
 * The colors (or modules) highlighted in every view of a tab, by index. A view calls
 * onHover with the indices under the pointer or in focus, and with NONE when it leaves.
 * Kept apart from the computed colors, so hovering never recomputes them.
 */
export type Hover = { hovered: readonly number[]; onHover: (indices: readonly number[]) => void };

const same = <T,>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Hover state that keeps its value when set to an equal list, so moving within an item does not re-render */
export function useHover<T = number>() {
  const [hovered, setHovered] = useState<readonly T[]>(NONE);
  const onHover = useCallback((next: readonly T[]) => setHovered((current) => (same(current, next) ? current : next)), []);
  return [hovered, onHover] as const;
}

/** The data-i of the event target or its closest ancestor that has one */
export const indexAt = (e: SyntheticEvent) => {
  const i = (e.target as Element).closest<HTMLElement | SVGElement>("[data-i]")?.dataset.i;
  return i === undefined ? null : +i;
};

/** Handlers for a container whose items carry data-i: the item under the pointer or in focus is hovered */
export const delegatedHover = (onHover: Hover["onHover"]) => {
  const set = (e: SyntheticEvent) => {
    const i = indexAt(e);
    onHover(i === null ? NONE : [i]);
  };
  const clear = () => onHover(NONE);
  return { onPointerOver: set, onPointerLeave: clear, onFocus: set, onBlur: clear };
};

/** Handlers that hover some indices while the pointer is over the element or it has focus */
export const hoverProps = (onHover: Hover["onHover"], indices: readonly number[]) => {
  const set = () => onHover(indices);
  const clear = () => onHover(NONE);
  return { onPointerEnter: set, onPointerLeave: clear, onFocus: set, onBlur: clear };
};

const isHovered = (hovered: readonly number[] | undefined, indices: readonly number[]) =>
  indices.length > 0 && indices.every((i) => hovered?.includes(i));

/** A color chip; with onHover, hovering or focusing it highlights its color in the other views */
export function Chip({ color, label, index, hovered, onHover }: { color: string; label: string; index: number } & Partial<Hover>) {
  if (!onHover) return <span className="chip" style={{ background: color }} title={label} />;
  return (
    <span
      className="chip"
      role="img"
      tabIndex={0}
      aria-label={label}
      title={label}
      style={{ background: color }}
      data-hover={isHovered(hovered, [index]) || undefined}
      {...hoverProps(onHover, [index])}
    />
  );
}

/** Text that names some colors, such as a closest pair; hovering or focusing it highlights them all */
export function HoverLabel({ indices, hovered, onHover, children }: { indices: readonly number[]; children: ReactNode } & Partial<Hover>) {
  if (!onHover) return <small>{children}</small>;
  return (
    <small className="hover-label" tabIndex={0} data-hover={isHovered(hovered, indices) || undefined} {...hoverProps(onHover, indices)}>
      {children}
    </small>
  );
}
