import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use the library source directly, so the docs get HMR on library changes.
const c3 = fileURLToPath(new URL("../../packages/c3/src/index.ts", import.meta.url));
const internal = fileURLToPath(new URL("../../packages/c3/src/internal.ts", import.meta.url));

export default defineConfig({
  base: "/c3/",
  plugins: [react()],
  resolve: {
    // The subpath first: an alias also matches imports below it
    alias: { "@mapequation/c3/internal": internal, "@mapequation/c3": c3 },
  },
});
