import notebook from "../../../python/examples/tutorial.ipynb";
import notebookUrl from "../../../python/examples/tutorial.ipynb?url&no-inline";
import type { Output } from "./notebook";
import { Band, Footer, Wordmark } from "./components/Page";

const COLAB = "https://colab.research.google.com/github/mapequation/c3/blob/main/python/examples/tutorial.ipynb";
const HOME = import.meta.env.BASE_URL;

function CellOutput({ output }: { output: Output }) {
  if (output.type === "image") {
    const { src, alt, width, height } = output;
    return <img src={src} alt={alt} width={width} height={height} loading="lazy" />;
  }
  return (
    <pre className={`nb-output ${output.type}`}>
      <code>{output.text}</code>
    </pre>
  );
}

/** The Python tutorial notebook, rendered at build time */
export default function Tutorial() {
  return (
    <>
      <header className="page masthead">
        <a className="wordmark" href={HOME}>
          <Wordmark />
        </a>
        <Band />
        <ul className="nb-links">
          <li>
            <a className="btn" href={COLAB}>
              Open in Colab
            </a>
          </li>
          <li>
            <a className="btn" href={notebookUrl} download="tutorial.ipynb">
              Download notebook
            </a>
          </li>
          <li>
            <a className="btn" href={HOME}>
              Back to the explorer and API
            </a>
          </li>
        </ul>
      </header>

      <main className="page tutorial">
        <nav className="toc" aria-labelledby="toc">
          <h2 id="toc">Contents</h2>
          <ul>
            {notebook.contents.map(({ id, text, depth }) => (
              <li key={id} data-depth={depth}>
                <a href={`#${id}`}>{text}</a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="nb">
          {notebook.cells.map((cell, i) =>
            cell.type === "markdown" ? (
              // Markdown from the notebook in the repository, rendered by marked at build time
              <div key={i} className="nb-markdown" dangerouslySetInnerHTML={{ __html: cell.html }} />
            ) : (
              <div key={i} className="nb-code">
                <pre>
                  <code>{cell.source}</code>
                </pre>
                {cell.outputs.map((output, j) => (
                  <CellOutput key={j} output={output} />
                ))}
              </div>
            ),
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}
