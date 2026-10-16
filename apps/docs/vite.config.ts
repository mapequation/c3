import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { notebook } from "./vite-plugin-notebook.ts";

// Use the library source directly, so the docs get HMR on library changes.
const c3 = fileURLToPath(new URL("../../packages/c3/src/index.ts", import.meta.url));
const internal = fileURLToPath(new URL("../../packages/c3/src/internal.ts", import.meta.url));
const { version } = JSON.parse(readFileSync(new URL("../../packages/c3/package.json", import.meta.url), "utf8"));

export default defineConfig({
  base: "/c3/",
  plugins: [react(), notebook()],
  // The library version, shown in the docs
  define: { __C3_VERSION__: JSON.stringify(version) },
  resolve: {
    // The subpath first: an alias also matches imports below it
    alias: { "@mapequation/c3/internal": internal, "@mapequation/c3": c3 },
  },
  build: {
    // The main page and the Python tutorial at tutorial/
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL("index.html", import.meta.url)),
        tutorial: fileURLToPath(new URL("tutorial/index.html", import.meta.url)),
      },
    },
  },
});
