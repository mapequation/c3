/** The library version from packages/c3/package.json, set by vite.config.ts */
declare const __C3_VERSION__: string;

/** Notebooks, ready to show, from vite-plugin-notebook.ts */
declare module "*.ipynb" {
  const notebook: import("./notebook").Notebook;
  export default notebook;
}
