import { Fragment, useMemo, useSyncExternalStore, type CSSProperties } from "react";
import type { CodeLang } from "../shiki";

let highlight: typeof import("../shiki").highlight | undefined;
const listeners = new Set<() => void>();

// Shiki loads after the page, which shows the same code as plain text until then
import("../shiki").then((shiki) => {
  highlight = shiki.highlight;
  listeners.forEach((listener) => listener());
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/** Code highlighted for the page's theme by styles.css. A prefix gives the grammar context and isn't shown. */
export function Code({ code, lang, prefix }: { code: string; lang: CodeLang; prefix?: string }) {
  const hl = useSyncExternalStore(subscribe, () => highlight);
  const lines = useMemo(() => hl?.(code, lang, prefix), [hl, code, lang, prefix]);
  return (
    <code className="shiki">
      {lines
        ? lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && "\n"}
              {line.map(({ text, light, dark }, j) =>
                light ? (
                  <span key={j} style={{ "--shiki-light": light, "--shiki-dark": dark } as CSSProperties}>
                    {text}
                  </span>
                ) : (
                  <Fragment key={j}>{text}</Fragment>
                ),
              )}
            </Fragment>
          ))
        : code}
    </code>
  );
}
