import { Fragment } from "react";
import { API, type Row } from "../api";

/** Render `backtick` spans as code */
function Text({ children }: { children: string }) {
  return children.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : <Fragment key={i}>{part}</Fragment>));
}

function Table({ caption, rows }: { caption: string; rows: Row[] }) {
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
                <code>{name}</code>
              </th>
              <td>
                <code>{type}</code>
              </td>
              <td>{def && <code>{def}</code>}</td>
              <td>
                <Text>{description}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApiReference() {
  return (
    <section className="api" aria-labelledby="api">
      <h2 id="api">API</h2>
      <nav aria-label="API functions">
        <ul className="api-index">
          {API.map(({ name }) => (
            <li key={name}>
              <a href={`#api-${name}`}>
                <code>{name}</code>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {API.map(({ name, signature, description, params, options, returns, example }) => (
        <article key={name} id={`api-${name}`} className="api-entry">
          <h3>
            <code>{signature}</code>
          </h3>
          {description.map((p) => (
            <p key={p}>
              <Text>{p}</Text>
            </p>
          ))}
          {params && <Table caption="Parameters" rows={params} />}
          {options && <Table caption="Options" rows={options} />}
          <p className="api-returns">
            <strong>Returns</strong> <Text>{returns}</Text>
          </p>
          <pre>
            <code>{example}</code>
          </pre>
        </article>
      ))}
    </section>
  );
}
