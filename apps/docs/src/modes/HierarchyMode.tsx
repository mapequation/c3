import { useDeferredValue, useId, useMemo, useRef, useState } from "react";
import {
  defaultHierarchyOptions,
  defaultPaletteOptions,
  hierarchy,
  type HierarchyOptions,
  type SchemeName,
} from "@mapequation/c3";
import { Check, Group, SchemeOptions, Slider } from "../components/Controls";
import { Icicle } from "../components/Icicle";
import { BallView } from "../components/BallView";
import { CodeSnippet } from "../components/CodeSnippet";
import { formatGap, formatMs } from "../components/Quality";
import { JUST_NOTICEABLE } from "../quality";
import { callCode, Raw } from "../code";
import { timed, unlessDefault } from "../util";
import { indexTree, MAX_CHARS, parseTree, sampleTree, treeQuality, type Gap, type Tree } from "../tree";

const EXAMPLE = `# path flow "name" node
1:1 0.3 "Alice" 1
1:2 0.2 "Bob" 2
2:1 0.25 "Carol" 3
2:2 0.15 "Dave" 4
2:3 0.1 "Eve" 5`;

function GapStat({ label, title, gap: { gap, pair }, tree }: { label: string; title: string; gap: Gap; tree: Tree }) {
  return (
    <div title={title}>
      <dt>{label}</dt>
      <dd data-warn={gap < JUST_NOTICEABLE || undefined}>
        {formatGap(gap)}
        {pair?.map((i) => (
          <span key={i} className="chip" style={{ background: tree.modules[i].color }} title={tree.modules[i].color} />
        ))}
        {pair && <small>{pair.map((i) => tree.keys[i]).join(" and ")}</small>}
      </dd>
    </div>
  );
}

export function HierarchyMode(_props: { n: number; setN: (n: number) => void }) {
  const [top, setTop] = useState(10);
  const [skew, setSkew] = useState(1.3);
  const [text, setText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [source, setSource] = useState<"circle" | SchemeName>("circle");
  const [hue, setHue] = useState(defaultPaletteOptions.hue);
  const [padding, setPadding] = useState(defaultHierarchyOptions.padding);
  const [useFlows, setUseFlows] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = useId();

  const deferredText = useDeferredValue(text);
  const parsed = useMemo(() => (deferredText.trim() ? parseTree(deferredText) : null), [deferredText]);
  const sample = useMemo(() => sampleTree(top, skew), [top, skew]);
  const own = parsed !== null && !parsed.error;
  const modules = own ? parsed.modules : sample;

  const scheme = source === "circle" ? undefined : source;
  const options = useMemo<HierarchyOptions>(
    () => ({
      hue: scheme ?? unlessDefault(hue, defaultPaletteOptions.hue),
      padding: unlessDefault(padding, defaultHierarchyOptions.padding),
    }),
    [scheme, hue, padding],
  );
  const input = useMemo(() => (useFlows ? modules : modules.map(({ path }) => ({ path }))), [modules, useFlows]);

  const deferred = useDeferredValue(useMemo(() => ({ input, options }), [input, options]));
  const result = useMemo(() => {
    const { input, options } = deferred;
    const [color, ms] = timed(() => hierarchy(input, options));
    const tree = indexTree(color.modules);
    return {
      tree,
      ms,
      quality: treeQuality(tree),
      colors: color.modules.map((m) => m.color),
      code: callCode("hierarchy", new Raw("modules"), options),
      padding: options.padding ?? defaultHierarchyOptions.padding,
    };
  }, [deferred]);

  const { tree, quality: q } = result;
  // Keys survive a new tree as long as the module is still there
  const toIndex = (key: string | null) => (key === null ? null : (tree.index.get(key) ?? null));
  const toKey = (i: number | null) => (i === null ? null : tree.keys[i]);
  const views = {
    tree,
    selected: toIndex(selected),
    hovered: toIndex(hovered),
    onSelect: (i: number | null) => setSelected(toKey(i)),
    onHover: (i: number | null) => setHovered(toKey(i)),
  };

  const errors = [fileError, parsed?.error].filter(Boolean);
  const invalid = parsed?.invalid ?? [];

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    const tooLarge = file.size > MAX_CHARS;
    setFileError(tooLarge ? `${file.name} is too large; the limit is ${MAX_CHARS / 1e6} MB.` : null);
    setText(tooLarge ? "" : await file.text());
  };

  const controls = (
    <>
      <Group legend="Sample tree">
        <Slider label="Top modules" value={top} onChange={setTop} min={2} max={20} disabled={own} />
        <Slider label="Flow skew" value={skew} onChange={setSkew} min={0.5} max={2} step={0.1} disabled={own} />
      </Group>

      <Group legend="Your Infomap tree">
        <label className="field" htmlFor={`${id}-tree`}>
          <span>Paste a .tree file or open one</span>
        </label>
        <textarea
          id={`${id}-tree`}
          rows={6}
          spellCheck={false}
          wrap="off"
          placeholder={EXAMPLE}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={errors.length > 0 || invalid.length > 0}
          aria-describedby={`${id}-status`}
        />
        <input ref={fileInput} type="file" accept=".tree,.ftree,.txt,text/plain" hidden onChange={(e) => {
          openFile(e.target.files?.[0]);
          e.target.value = "";
        }} />
        <div id={`${id}-status`}>
          {errors.map((error) => (
            <p key={error} className="error" role="alert">
              {error} Showing the sample tree.
            </p>
          ))}
          {invalid.length > 0 && (
            <p className="error" role="alert">
              Not <code>path flow "name" node</code>, left out: line {invalid[0].line} <code>{invalid[0].text.slice(0, 32)}</code>
              {invalid.length > 1 && ` and ${invalid.length - 1} more`}
            </p>
          )}
          {own && (
            <p className="hint">
              {parsed.nodes.toLocaleString("en")} nodes in {parsed.modules.length.toLocaleString("en")} modules.
            </p>
          )}
        </div>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Open .tree file
          </button>
          <button
            type="button"
            className="btn"
            disabled={!text && !fileError}
            onClick={() => {
              setText("");
              setFileError(null);
            }}
          >
            Use sample tree
          </button>
        </div>
      </Group>

      <Group legend="Top module hues">
        <label className="field">
          <span>Hue source</span>
          <select value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
            <option value="circle">OKLCH hue circle</option>
            <SchemeOptions />
          </select>
        </label>
        <Slider label="First hue" value={hue} onChange={setHue} min={0} max={360} disabled={!!scheme} />
      </Group>

      <Group legend="Balls">
        <Slider label="Padding" value={padding} onChange={setPadding} min={0} max={0.6} step={0.01} />
        <Check label="Use flows" checked={useFlows} onChange={setUseFlows} />
      </Group>
    </>
  );

  return (
    <div className="mode">
      <aside className="controls">{controls}</aside>
      <div className="views">
        <figure className="wide">
          <Icicle {...views} />
          <figcaption>
            The whole tree, {tree.modules.length.toLocaleString("en")} modules on {tree.levels.length} levels: one row per
            level, each module as wide as its share of its parent's flow{useFlows ? "" : " (here its number of leaf modules)"}.
            Click a module to look into its ball below; arrow keys move the selection.
          </figcaption>
        </figure>

        <BallView {...views} padding={result.padding} />

        <section className="quality" aria-label="Quality">
          <h3>Quality</h3>
          <dl className="stats">
            <GapStat label="Closest siblings" title="Smallest distance between two modules with the same parent" gap={q.sibling} tree={tree} />
            <GapStat label="Closest cousins" title="Smallest distance between two modules on the same level with different parents" gap={q.cousin} tree={tree} />
            <div title="Modules closer to their parent than to any other module on the parent's level">
              <dt>Nearest their parent</dt>
              <dd>
                {q.near} <small>of {q.total}</small>
              </dd>
            </div>
            <div title="Time the library call took in this browser">
              <dt>Generated in</dt>
              <dd>{formatMs(result.ms)}</dd>
            </div>
          </dl>
          <p className="quality-note">
            Distances in OKLab, as <code>distance()</code> measures them. About {JUST_NOTICEABLE} is just noticeable.
            Siblings share a parent; cousins are on the same level with different parents.
          </p>
        </section>

        <CodeSnippet code={result.code} colors={result.colors} title="Module colors, depth first" />
      </div>
    </div>
  );
}
