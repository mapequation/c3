import { Fragment } from "react";
import { API, pythonName, toPython, type Row } from "../api";
import { snake } from "../code";
import { pick, useLang, type ByLang, type Lang } from "../lang";
import { LangSwitch } from "./LangSwitch";

/** Render `backtick` spans as code, in Python where it differs */
function Text({ children, lang }: { children: string | ByLang; lang: Lang }) {
  return pick(children, lang)
    .split("`")
    .map((part, i) =>
      i % 2 ? <code key={i}>{lang === "py" ? toPython(part) : part}</code> : <Fragment key={i}>{part}</Fragment>,
    );
}

function Table({ caption, rows, lang }: { caption: string; rows: Row[]; lang: Lang }) {
  const py = lang === "py";
  return (
    <div className="api-table">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, def, description]) => (
            <tr key={name}>
              <th scope="row">
                <code>{py ? pythonName(name) : name}</code>
              </th>
              <td>
                <code>{py ? toPython(pick(type, lang)) : pick(type, lang)}</code>
              </td>
              <td>{pick(def, lang) && <code>{pick(def, lang)}</code>}</td>
              <td>
                <Text lang={lang}>{description}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApiReference() {
  const lang = useLang();
  const py = lang === "py";
  return (
    <section className="api" aria-labelledby="api">
      <div className="api-head">
        <h2 id="api">API</h2>
        <LangSwitch />
      </div>
      {py && (
        <p className="api-intro">
          The Python port, <code>import c3</code>, has the same functions and gives the same colors, with names in
          snake_case and options as keyword arguments. New to it? Start with the{" "}
          <a href={`${import.meta.env.BASE_URL}tutorial/`}>Python tutorial</a>.
        </p>
      )}
      <nav aria-label="API functions">
        <ul className="api-index">
          {API.map(({ name, deprecated }) => (
            <li key={name}>
              <a href={`#api-${name}`}>
                <code>{py ? snake(name) : name}</code>
              </a>
              {deprecated && " (deprecated)"}
            </li>
          ))}
        </ul>
      </nav>
      {API.map(({ name, deprecated, signature, description, params, options, optionsCaption, returns, example, python }) => (
        // Ids keep the JS names, so links work in both languages
        <article key={name} id={`api-${name}`} className="api-entry">
          <h3>
            <code>{signature[lang]}</code>
          </h3>
          {deprecated && (
            <p>
              <strong>Deprecated.</strong> <Text lang={lang}>{deprecated}</Text>
            </p>
          )}
          {description.map((p) => (
            <p key={pick(p, "js")}>
              <Text lang={lang}>{p}</Text>
            </p>
          ))}
          {py && python && (
            <p className="api-note">
              <strong>In Python</strong> <Text lang={lang}>{python}</Text>
            </p>
          )}
          {params && <Table caption="Parameters" rows={params} lang={lang} />}
          {options && (
            <Table caption={optionsCaption ?? (py ? "Keyword arguments" : "Options")} rows={options} lang={lang} />
          )}
          <p className="api-returns">
            <strong>Returns</strong> <Text lang={lang}>{returns}</Text>
          </p>
          <pre>
            <code>{example[lang]}</code>
          </pre>
        </article>
      ))}
    </section>
  );
}
