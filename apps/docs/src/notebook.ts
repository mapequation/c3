/** A Jupyter notebook, as the notebook plugin in vite-plugin-notebook.ts gives it to the tutorial page */
export type Notebook = {
  cells: Cell[];
  /** The h2 and h3 headings, for the table of contents */
  contents: { id: string; text: string; depth: number }[];
};

/** Markdown as HTML, and code cells as HTML highlighted for styles.css */
export type Cell = { type: "markdown"; html: string } | { type: "code"; html: string; outputs: Output[] };

/** Figures, and text output: results, stdout and errors */
export type Output =
  | { type: "image"; src: string; alt: string; width?: number; height?: number }
  | { type: "text" | "error"; text: string };
