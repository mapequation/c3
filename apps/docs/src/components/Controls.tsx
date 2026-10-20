import { useId, useState, type ReactNode } from "react";
import { tones, type Range, type Tone, type ToneName } from "@mapequation/c3";
import { SCHEMES, toneName } from "../util";

type SliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  /** Name of the inputs, when the label alone does not say it */
  ariaLabel?: string;
};

const decimals = (step: number) => (String(step).split(".")[1] ?? "").length;

/** Range input with an editable number next to the label */
export function Slider({ label, value, onChange, min, max, step = 1, disabled, ariaLabel }: SliderProps) {
  const id = useId();
  const set = (v: number) => Number.isFinite(v) && onChange(Math.min(max, Math.max(min, v)));
  const shared = { min, max, step, disabled };
  return (
    <div className="slider" data-disabled={disabled || undefined}>
      <label htmlFor={id}>{label}</label>
      <input
        className="num"
        type="number"
        aria-label={ariaLabel ?? label}
        value={+value.toFixed(decimals(step))}
        onChange={(e) => e.target.value !== "" && set(e.target.valueAsNumber)}
        {...shared}
      />
      <input id={id} type="range" aria-label={ariaLabel} value={value} onChange={(e) => set(e.target.valueAsNumber)} {...shared} />
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

/** A group of controls that opens and closes by its legend; closed ones start closed */
export function Group({ legend, closed = false, children }: { legend: ReactNode; closed?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(!closed);
  const id = useId();
  return (
    <fieldset className="group" data-closed={!open || undefined}>
      <legend>
        <button type="button" className="group-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {legend}
        </button>
      </legend>
      <div id={id} hidden={!open}>
        {children}
      </div>
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
    // Side by side, read as "Lightness 0.4 to 0.8"
    <div className="slider-pair">
      <Slider label={label} ariaLabel={`${label} min`} value={lo} onChange={(v) => onChange([v, Math.max(v, hi)])} {...props} />
      <Slider label="to" ariaLabel={`${label} max`} value={hi} onChange={(v) => onChange([Math.min(lo, v), v])} {...props} />
    </div>
  );
}

/** Tone select, with a "custom" entry while the sliders have moved off every named tone */
export function ToneControls({
  tone,
  onChange,
  autoLabel,
  auto = false,
}: {
  tone: Tone;
  /** The chosen tone, or null for the inferred one */
  onChange: (tone: Tone | null) => void;
  /** Label of the entry for the tone the library uses without a tone option */
  autoLabel: string;
  /** Whether the tone is that one, not one chosen with the select or the sliders */
  auto?: boolean;
}) {
  const id = useId();
  const name = toneName(tone);
  const value = auto ? "auto" : (name ?? "custom");
  // The entry last picked in the select, which Reset takes the sliders back to
  const [picked, setPicked] = useState<"auto" | ToneName>(value === "custom" ? "auto" : value);
  const pick = (key: "auto" | ToneName) => {
    setPicked(key);
    onChange(key === "auto" ? null : tones[key]);
  };
  const set = <K extends keyof Tone>(key: K) => (value: Tone[K]) => onChange({ ...tone, [key]: value });
  return (
    <>
      <div className="field">
        <div className="field-head">
          <label htmlFor={id}>Tone</label>
          {value === "custom" && (
            <button type="button" className="text-btn" onClick={() => pick(picked)}>
              Reset
            </button>
          )}
        </div>
        <select id={id} value={value} onChange={(e) => pick(e.target.value as "auto" | ToneName)}>
          <option value="auto">{autoLabel}</option>
          {(Object.keys(tones) as ToneName[]).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
          {value === "custom" && (
            <option value="custom" disabled>
              Custom
            </option>
          )}
        </select>
      </div>
      <RangeSliders label="Lightness" value={tone.lightness} onChange={set("lightness")} min={0} max={1} step={0.01} />
      <RangeSliders label="Chroma" value={tone.chroma} onChange={set("chroma")} min={0} max={0.37} step={0.005} />
      <div className="slider-pair">
        <Slider label="Warm hue" value={tone.warmHue} onChange={set("warmHue")} min={0} max={360} />
        <Slider label="Tilt" value={tone.tilt} onChange={set("tilt")} min={0} max={1} step={0.01} />
      </div>
      <p className="hint">
        A tone is the lightness and chroma the colors come from. The warm hue can get the most chroma. Tilt is how much
        less chroma hues far from it get: 0 for none, 1 for grey at the opposite hue.
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
