import { Activity, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { palette } from "@mapequation/c3";
import { SchemesMode } from "./modes/SchemesMode";
import { PaletteMode } from "./modes/PaletteMode";
import { SeedsMode } from "./modes/SeedsMode";
import { HierarchyMode } from "./modes/HierarchyMode";
import { ApiReference } from "./components/ApiReference";
import { HowItWorks } from "./components/HowItWorks";
import { LangSwitch } from "./components/LangSwitch";
import { Band, Footer, Wordmark } from "./components/Page";
import { PACKAGES, pick, useLang, type ByLang } from "./lang";

const FEATURES: [string, ReactNode][] = [
  ["Unlimited colors", "Generate as many colors as you want."],
  [
    "Any color scheme",
    <>
      Hues come from the <a href="#how-it-works">OKLCH</a> hue circle or any{" "}
      <a href="https://github.com/d3/d3-scale-chromatic">d3 color scheme</a>.
    </>,
  ],
  ["Deterministic", "You always get the same colors for the same number of colors."],
  ["Consistent", "Asking for more colors never changes the colors you already have."],
  [
    "Fast",
    "n colors take time proportional to n log n. Choosing colors by distance, as with seeds, takes longer but stays within milliseconds for hundreds of colors.",
  ],
];

/** A library call in the chosen language */
function Call({ code }: { code: string | ByLang }) {
  return <code>{pick(code, useLang())}</code>;
}

const SCHEME_CALL = { js: "palette({ hue: scheme })", py: "palette(hue=scheme)" };

const MODES = [
  {
    id: "palette",
    label: "Palette",
    fn: "palette()",
    about: (
      <>
        Colors from the <a href="#how-it-works">Halton sequence</a>: hues at the Cantor stops on the OKLCH hue circle or
        a d3 scheme, lightness and chroma (how colorful a color is) within the tone, strong by default.
      </>
    ),
    Mode: PaletteMode,
  },
  {
    id: "seeds",
    label: "Seeds",
    fn: { js: "palette({ seeds })", py: "palette(seeds=...)" },
    about:
      "Start from your own colors, the seeds, and add new ones from the Halton sequence, each as far as possible from the colors before it. New colors stay within the tone inferred from the seeds.",
    Mode: SeedsMode,
  },
  {
    id: "hierarchy",
    label: "Hierarchy",
    fn: "hierarchy()",
    about:
      "Color nested modules, like an Infomap tree. Top modules get palette() colors weighted by flow, their share of the whole. Children get colors as far apart as possible within their parent's ball: all colors within a radius of the parent's color in OKLab.",
    Mode: HierarchyMode,
  },
  {
    // Keeps its old id, so links to #schemes still work
    id: "schemes",
    label: "Schemes",
    fn: SCHEME_CALL,
    about: (
      <>
        Compare a d3 color scheme's own colors at the Cantor stops with <Call code={SCHEME_CALL} />, which takes only
        the hues from the scheme and sets lightness and chroma from the tone, keeping colors farther apart for every
        scheme.
      </>
    ),
    Mode: SchemesMode,
  },
] as const;

type ModeId = (typeof MODES)[number]["id"];

/** Old tab ids, so links to them still work */
const ALIASES: Record<string, ModeId> = { extend: "seeds" };

const markers = palette(FEATURES.length);

function initialMode(): ModeId {
  const hash = window.location.hash.slice(1);
  return ALIASES[hash] ?? MODES.find((m) => m.id === hash)?.id ?? "palette";
}

/** How to install the package in the chosen language, with links */
function Install() {
  const lang = useLang();
  return (
    <div className="install">
      <LangSwitch />
      <pre>
        <code>{lang === "py" ? `pip install ${PACKAGES.py}` : `npm install ${PACKAGES.js}`}</code>
      </pre>
      <p>
        <a className="version" href={`https://github.com/mapequation/c3/releases/tag/v${__C3_VERSION__}`}>
          v{__C3_VERSION__}
        </a>{" "}
        Source on <a href="https://github.com/mapequation/c3">GitHub</a>, package on{" "}
        {lang === "py" ? (
          <a href={`https://pypi.org/project/${PACKAGES.py}/`}>PyPI</a>
        ) : (
          <a href={`https://www.npmjs.com/package/${PACKAGES.js}`}>npm</a>
        )}
        . <a href="#how-it-works">How it works</a>, <a href="#api">API reference</a>,{" "}
        <a href={`${import.meta.env.BASE_URL}tutorial/`}>Python tutorial</a>.
      </p>
    </div>
  );
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
            {label} <Call code={fn} />
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
          <Wordmark />
        </h1>
        <p className="tagline">
          Deterministic colors for maps, inspired by the{" "}
          <a href="https://en.wikipedia.org/wiki/Cantor_set">Cantor set</a> fractal.
        </p>
        <Band />
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
          <Install />
        </section>

        <Explorer />

        <HowItWorks />

        <ApiReference />
      </main>

      <Footer />
    </>
  );
}
