import { useId, type ReactNode } from "react";
import type { Range, Region } from "@mapequation/c3";
import { SCHEMES } from "../util";

type SliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
};

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

/** Range input with an editable number next to the label */
export function Slider({ label, value, onChange, min, max, step = 1, disabled }: SliderProps) {
  const id = useId();
  const set = (v: number) => Number.isFinite(v) && onChange(Math.min(max, Math.max(min, v)));
  const shared = { min, max, step, disabled };
  return (
    <div className="slider" data-disabled={disabled || undefined}>
      <label htmlFor={id}>{label}</label>
      <input
        className="num"
        type="number"
        aria-label={label}
        value={+value.toFixed(decimals(step))}
        onChange={(e) => e.target.value !== "" && set(e.target.valueAsNumber)}
        {...shared}
      />
      <input id={id} type="range" value={value} onChange={(e) => set(e.target.valueAsNumber)} {...shared} />
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function Group({ legend, children }: { legend: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="group">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

type RangeProps = Omit<SliderProps, "value" | "onChange" | "label"> & {
  label: string;
  value: Range;
  onChange: (value: Range) => void;
};

/** Two sliders for [min, max] that push each other to keep min <= max */
export function RangeSliders({ label, value: [lo, hi], onChange, ...props }: RangeProps) {
  return (
    <>
      <Slider label={`${label} min`} value={lo} onChange={(v) => onChange([v, Math.max(v, hi)])} {...props} />
      <Slider label={`${label} max`} value={hi} onChange={(v) => onChange([Math.min(lo, v), v])} {...props} />
    </>
  );
}

export function RegionControls({
  region,
  onChange,
  disabled,
}: {
  region: Region;
  onChange: (region: Region) => void;
  disabled?: boolean;
}) {
  const set = <K extends keyof Region>(key: K) => (value: Region[K]) => onChange({ ...region, [key]: value });
  return (
    <>
      <RangeSliders label="Lightness" value={region.lightness} onChange={set("lightness")} min={0} max={1} step={0.01} disabled={disabled} />
      <RangeSliders label="Chroma" value={region.chroma} onChange={set("chroma")} min={0} max={0.37} step={0.005} disabled={disabled} />
      <Slider label="Warm hue" value={region.warmHue} onChange={set("warmHue")} min={0} max={360} disabled={disabled} />
      <Slider label="Tilt" value={region.tilt} onChange={set("tilt")} min={0} max={1} step={0.01} disabled={disabled} />
      <p className="hint">
        The warm hue can get the most chroma. Tilt is how much less chroma hues far from it get: 0 for none, 1 for grey at
        the opposite hue.
      </p>
    </>
  );
}

/** The d3 schemes as select options, grouped by kind */
export function SchemeOptions() {
  return Object.entries(SCHEMES).map(([group, names]) => (
    <optgroup key={group} label={group}>
      {names.map((name) => (
        <option key={name}>{name}</option>
      ))}
    </optgroup>
  ));
}

export function ModeLayout({
  n,
  setN,
  controls,
  children,
}: {
  n: number;
  setN: (n: number) => void;
  controls: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mode">
      <aside className="controls">
        <div className="count">
          <Slider label="Number of colors" value={n} onChange={setN} min={1} max={256} />
        </div>
        {controls}
      </aside>
      <div className="views">{children}</div>
    </div>
  );
}
