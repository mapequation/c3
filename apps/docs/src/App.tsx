import { Activity, useRef, useState, type KeyboardEvent } from "react";
import { palette } from "@mapequation/c3";
import { SchemesMode } from "./modes/SchemesMode";
import { PaletteMode } from "./modes/PaletteMode";
import { ExtendMode } from "./modes/ExtendMode";
import { ApiReference } from "./components/ApiReference";

const FEATURES = [
  ["Unlimited colors", "Generate as many colors as you want."],
  ["Any color scheme", "palette() takes hues from any d3 color scheme or from the OKLCH hue circle."],
  ["Deterministic", "You always get the same colors for the same number of colors."],
  ["Consistent", "Asking for more colors never changes the colors you already have."],
  ["Fast", "O(n log n) for n colors. Extending a palette is O(n · m) with m candidates, or O(n · w + n²) with the Halton method."],
];

const MODES = [
  {
    id: "palette",
    label: "Palette",
    fn: "palette()",
    about:
      "Spread colors over a region of OKLCH space: hue from the Cantor stops along the hue circle or a d3 scheme, lightness and chroma from a Halton sequence. Later colors move to a lighter end zone.",
    Mode: PaletteMode,
  },
  {
    id: "extend",
    label: "Extend",
    fn: "extend()",
    about: "Start from your own colors and add new ones, each as far as possible from all colors before it.",
    Mode: ExtendMode,
  },
  {
    // Keeps its old id, so links to #schemes still work
    id: "schemes",
    label: "Classic",
    fn: "colors()",
    about: (
      <>
        Pick colors from a d3 color scheme at the Cantor stops, with saturation and lightness set by depth.{" "}
        <strong>Deprecated:</strong> use <code>{"palette({ hue: scheme })"}</code>, which is more distinct for every
        scheme.
      </>
    ),
    Mode: SchemesMode,
  },
] as const;

type ModeId = (typeof MODES)[number]["id"];

const band = palette(40);
const markers = palette(FEATURES.length);

function initialMode(): ModeId {
  const hash = window.location.hash.slice(1);
  return MODES.find((m) => m.id === hash)?.id ?? "palette";
}

function Explorer() {
  const [mode, setMode] = useState<ModeId>(initialMode);
  const [n, setN] = useState(16);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = MODES.find((m) => m.id === mode)!;

  const select = (id: ModeId) => {
    setMode(id);
    history.replaceState(null, "", `#${id}`);
  };

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const j = (i + step + MODES.length) % MODES.length;
    select(MODES[j].id);
    tabs.current[j]?.focus();
  };

  return (
    <section className="explorer" aria-labelledby="explore">
      <h2 id="explore">Explore</h2>
      <div className="tabs" role="tablist" aria-label="Library functions">
        {MODES.map(({ id, label, fn }, i) => (
          <button
            key={id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            id={`tab-${id}`}
            type="button"
            role="tab"
            className="tab"
            aria-selected={mode === id}
            aria-controls={`panel-${id}`}
            tabIndex={mode === id ? 0 : -1}
            onClick={() => select(id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {label} <code>{fn}</code>
          </button>
        ))}
      </div>
      <p className="about">{active.about}</p>
      {MODES.map(({ id, Mode }) => (
        // Hidden modes keep their settings and update in the background
        <Activity key={id} mode={mode === id ? "visible" : "hidden"}>
          <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`}>
            <Mode n={n} setN={setN} />
          </div>
        </Activity>
      ))}
    </section>
  );
}

export default function App() {
  return (
    <>
      <header className="page masthead">
        <h1 className="wordmark">
          <span className="mark" aria-hidden="true">
            C3
          </span>
          <span className="words">
            <span>
              C<span>onsistent</span>
            </span>{" "}
            <span>
              C<span>ategorical</span>
            </span>{" "}
            <span>
              C<span>olors</span>
            </span>
          </span>
        </h1>
        <p className="tagline">
          Deterministic colors for maps, inspired by the{" "}
          <a href="https://en.wikipedia.org/wiki/Cantor_set">Cantor set</a> fractal.
        </p>
        <div className="band" aria-hidden="true">
          {band.map((c, i) => (
            <span key={i} style={{ background: c }} />
          ))}
        </div>
      </header>

      <main className="page">
        <section className="intro" aria-label="Features">
          <dl className="features">
            {FEATURES.map(([title, text], i) => (
              <div key={title}>
                <dt>
                  <span className="marker" style={{ background: markers[i] }} />
                  {title}
                </dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
          <div className="install">
            <pre>
              <code>npm install @mapequation/c3</code>
            </pre>
            <p>
              Source on <a href="https://github.com/mapequation/c3">GitHub</a>, package on{" "}
              <a href="https://www.npmjs.com/package/@mapequation/c3">npm</a>, <a href="#api">API reference</a>.
            </p>
          </div>
        </section>

        <Explorer />

        <ApiReference />
      </main>

      <footer className="page footer">
        <p>
          C3 by Daniel Edler and Anton Eriksson, <a href="https://www.mapequation.org">mapequation.org</a>. Apache-2.0
          license.
        </p>
      </footer>
    </>
  );
}
