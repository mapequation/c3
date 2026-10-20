import { palette } from "@mapequation/c3";
import { Icon } from "./Icon";

const band = palette(40);
const HOME = import.meta.env.BASE_URL;
const REPO = "https://github.com/mapequation/c3";
const MAPEQUATION = "https://mapequation.org";

/** mapequation.org, the site's sections, the tutorial, the release and the source. On the tutorial, sections link to the main page. */
export function SiteNav({ tutorial = false }: { tutorial?: boolean }) {
  const main = tutorial ? HOME : "";
  return (
    <nav className="site-nav" aria-label="Site">
      <div className="page">
        <a className="home" href={MAPEQUATION} aria-label="mapequation.org" title="mapequation.org">
          <img alt="" width="28" height="28" src={`${MAPEQUATION}/assets/img/twocolormapicon_whiteboarder.svg`} />
        </a>
        <ul>
          <li>
            <a href={`${main}#explore`}>Explore</a>
          </li>
          <li>
            <a href={`${main}#how-it-works`}>How it works</a>
          </li>
          <li>
            <a href={`${main}#api`}>
              API<span className="wide"> reference</span>
            </a>
          </li>
          <li>
            <a href={`${HOME}tutorial/`} aria-current={tutorial ? "page" : undefined}>
              Python tutorial
            </a>
          </li>
        </ul>
        <a className="version" href={`${REPO}/releases/tag/v${__C3_VERSION__}`} title="Release notes">
          v{__C3_VERSION__}
        </a>
        <a className="github" href={REPO} aria-label="Source on GitHub" title="Source on GitHub">
          <Icon name="github" />
        </a>
      </div>
    </nav>
  );
}

/** The C3 mark and its words, for the masthead of every page */
export function Wordmark() {
  return (
    <>
      <span className="mark" aria-hidden="true">
        C3
      </span>
      <span className="words">
        <span>
          C<span>onsistent</span>
        </span>{" "}
        <span>
          C<span>ategorical</span>
        </span>{" "}
        <span>
          C<span>olors</span>
        </span>
      </span>
    </>
  );
}

export function Band() {
  return (
    <div className="band" aria-hidden="true">
      {band.map((c, i) => (
        <span key={i} style={{ background: c }} />
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="page footer">
      <p>
        C3 by Daniel Edler and Anton Eriksson, <a href="https://www.mapequation.org">mapequation.org</a>. Apache-2.0
        license.
      </p>
    </footer>
  );
}
