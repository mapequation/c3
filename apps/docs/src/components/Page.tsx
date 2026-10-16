import { palette } from "@mapequation/c3";

const band = palette(40);

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
