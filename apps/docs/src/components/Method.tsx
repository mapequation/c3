import { useMemo, useState } from "react";
import type { Method } from "@mapequation/c3";
import { defaultPaletteOptions } from "@mapequation/c3/internal";
import { Slider } from "./Controls";
import { unlessDefault } from "../util";

const LABELS: Record<Method, string> = {
  sequence: "sequence (fastest)",
  farthest: "farthest (most distinct)",
  lookahead: "lookahead (in between)",
};

const HINTS: Record<Method, string> = {
  sequence: "Takes the colors of the Halton sequence in order. Two colors can land close by chance.",
  farthest: "Picks each color as far as possible from the colors so far, among the first Candidates colors of the Halton sequence.",
  lookahead: "Picks each color as far as possible from the colors so far, among the next Lookahead unused colors of the Halton sequence.",
};

/**
 * State and controls for palette()'s method option and its count.
 * @param methods the methods to offer, the first being the library default
 * @param hints hints to show instead of the default ones, by method
 * @returns the method, the options that differ from the defaults, and the controls
 */
export function useMethod(methods: readonly Method[], hints: Partial<Record<Method, string>> = {}) {
  const fallback = methods[0];
  const [method, setMethod] = useState(fallback);
  const [candidates, setCandidates] = useState(defaultPaletteOptions.candidates);
  const [lookahead, setLookahead] = useState(defaultPaletteOptions.lookahead);

  const options = useMemo(
    () => ({
      method: unlessDefault(method, fallback),
      candidates: method === "farthest" ? unlessDefault(candidates, defaultPaletteOptions.candidates) : undefined,
      lookahead: method === "lookahead" ? unlessDefault(lookahead, defaultPaletteOptions.lookahead) : undefined,
    }),
    [method, fallback, candidates, lookahead],
  );

  const controls = (
    <>
      <label className="field">
        <span>How the next color is chosen</span>
        <select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
          {methods.map((m) => (
            <option key={m} value={m}>
              {LABELS[m]}
            </option>
          ))}
        </select>
      </label>
      {method === "farthest" && (
        <Slider label="Candidates" value={candidates} onChange={setCandidates} min={16} max={16384} step={16} />
      )}
      {method === "lookahead" && <Slider label="Lookahead" value={lookahead} onChange={setLookahead} min={1} max={256} />}
      <p className="hint">{hints[method] ?? HINTS[method]}</p>
    </>
  );

  return { method, options, controls };
}
