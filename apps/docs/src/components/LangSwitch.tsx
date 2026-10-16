import { setLang, useLang, type Lang } from "../lang";

const LANGS: [Lang, string][] = [
  ["js", "JS"],
  ["py", "Python"],
];

/** The JS/Python switch. Every switch on the page shows and sets the same language. */
export function LangSwitch() {
  const lang = useLang();
  return (
    <div className="lang" role="group" aria-label="Code language">
      {LANGS.map(([id, label]) => (
        <button key={id} type="button" aria-pressed={lang === id} onClick={() => setLang(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}
