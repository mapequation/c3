/** The library version from packages/c3/package.json, set by vite.config.ts */
declare const __C3_VERSION__: string;

/** The us-atlas states, a TopoJSON topology; usShapes.ts gives it its type */
declare module "us-atlas/states-albers-10m.json" {
  const topology: unknown;
  export default topology;
}

/** Notebooks, ready to show, from vite-plugin-notebook.ts */
declare module "*.ipynb" {
  const notebook: import("./notebook").Notebook;
  export default notebook;
}
