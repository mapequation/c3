import { Fragment } from "react";
import { useCopy } from "../util";
import { useLang, type ByLang } from "../lang";
import { delegatedHover, NONE, type Hover } from "./Hover";
import { LangSwitch } from "./LangSwitch";

/**
 * The library call for the current settings in JS or Python, and its output, both copyable.
 * With onHover, hovering a color in the output highlights it in the other views.
 */
export function CodeSnippet({
  code,
  colors,
  title = "Hex values",
  hovered = NONE,
  onHover,
}: { code: ByLang; colors: string[]; title?: string } & Partial<Hover>) {
  const { copy, label } = useCopy();
  const shown = code[useLang()];
  const array = `[${colors.map((c) => JSON.stringify(c)).join(", ")}]`;

  return (
    <div className="snippet">
      <div className="snippet-head">
        <h3>Code</h3>
        <div className="snippet-actions">
          <LangSwitch />
          <button type="button" className="btn" onClick={() => copy("code", shown)}>
            {label("code", "Copy code")}
          </button>
        </div>
      </div>
      <pre>
        <code>{shown}</code>
      </pre>
      <div className="snippet-head">
        <h3>{title}</h3>
        <button type="button" className="btn" onClick={() => copy("array", array)}>
          {label("array", "Copy array")}
        </button>
      </div>
      <pre className="output" {...(onHover && delegatedHover(onHover))}>
        <code>
          [
          {colors.map((c, i) => (
            <Fragment key={i}>
              <span data-i={i}>
                <span className="chip" style={{ background: c }} data-hover={hovered.includes(i) || undefined} />
                &quot;{c}&quot;
              </span>
              {i + 1 < colors.length && ", "}
            </Fragment>
          ))}
          ]
        </code>
      </pre>
    </div>
  );
}
