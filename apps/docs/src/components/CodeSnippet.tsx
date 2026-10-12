import { Fragment } from "react";
import { useCopy } from "../util";

/** The library call for the current settings and its output, both copyable */
export function CodeSnippet({ code, colors }: { code: string; colors: string[] }) {
  const { copy, label } = useCopy();
  const array = `[${colors.map((c) => JSON.stringify(c)).join(", ")}]`;

  return (
    <div className="snippet">
      <div className="snippet-head">
        <h3>Code</h3>
        <button type="button" className="btn" onClick={() => copy("code", code)}>
          {label("code", "Copy code")}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      <div className="snippet-head">
        <h3>Hex values</h3>
        <button type="button" className="btn" onClick={() => copy("array", array)}>
          {label("array", "Copy array")}
        </button>
      </div>
      <pre className="output">
        <code>
          [
          {colors.map((c, i) => (
            <Fragment key={i}>
              <span className="chip" style={{ background: c }} />
              &quot;{c}&quot;{i + 1 < colors.length && ", "}
            </Fragment>
          ))}
          ]
        </code>
      </pre>
    </div>
  );
}
