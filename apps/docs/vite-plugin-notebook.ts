import { createHash } from "node:crypto";
import { Marked } from "marked";
import type { Plugin } from "vite";
import type { Notebook, Output } from "./src/notebook.ts";

/** nbformat text: a string or a list of lines */
type Source = string | string[];
type RawOutput = {
  output_type: string;
  name?: string;
  text?: Source;
  data?: Record<string, Source>;
  metadata?: Record<string, { width?: number; height?: number }>;
  ename?: string;
  evalue?: string;
};
type RawCell = { cell_type: string; source: Source; outputs?: RawOutput[] };

const join = (text: Source = "") => (Array.isArray(text) ? text.join("") : text);

/** A heading's text without markdown, for its id, the contents and alt text */
const plain = (markdown: string) => markdown.replace(/`|\*|\[([^\]]*)\]\([^)]*\)/g, "$1");

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";

/** Width and height in CSS pixels from the svg element, where matplotlib gives them in pt */
function svgSize(svg: string) {
  const tag = svg.match(/<svg[^>]*>/)?.[0] ?? "";
  const px = (name: string) => {
    const m = tag.match(new RegExp(`\\s${name}="([\\d.]+)(pt|px)?"`));
    return m ? Math.round(+m[1] * (m[2] === "pt" ? 4 / 3 : 1)) : undefined;
  };
  return { width: px("width"), height: px("height") };
}

/** Width and height from the PNG header */
const pngSize = (png: Buffer) => ({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) });

/**
 * The notebook ready to show: markdown as HTML with heading ids, code cells with their outputs.
 * Of the outputs, it keeps SVG and PNG figures, text results, stdout and errors.
 * @param figure gives the URL of an image
 */
function render(cells: RawCell[], figure: (data: Buffer, ext: string) => string): Notebook {
  const contents: Notebook["contents"] = [];
  const ids = new Set<string>();
  // The heading above the current cell, for alt text
  let heading = "";
  let figures = 0;

  const marked = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        heading = plain(text);
        let id = slug(heading);
        for (let k = 2; ids.has(id); k++) id = `${slug(heading)}-${k}`;
        ids.add(id);
        if (depth === 2 || depth === 3) contents.push({ id, text: heading, depth });
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
    },
  });

  const output = ({ output_type, name, text, data = {}, metadata = {}, ename, evalue }: RawOutput): Output[] => {
    if (output_type === "stream") return name === "stdout" ? [{ type: "text", text: join(text) }] : [];
    if (output_type === "error") return [{ type: "error", text: `${ename}: ${evalue}` }];
    const svg = data["image/svg+xml"];
    const png = data["image/png"];
    if (svg || png) {
      figures++;
      const alt = heading ? `Figure ${figures}: ${heading}` : `Figure ${figures}`;
      if (svg) return [{ type: "image", src: figure(Buffer.from(join(svg)), "svg"), alt, ...svgSize(join(svg)) }];
      const bytes = Buffer.from(join(png), "base64");
      return [{ type: "image", src: figure(bytes, "png"), alt, ...pngSize(bytes), ...metadata["image/png"] }];
    }
    return data["text/plain"] ? [{ type: "text", text: join(data["text/plain"]) }] : [];
  };

  return {
    cells: cells.flatMap((cell): Notebook["cells"] => {
      const source = join(cell.source);
      if (cell.cell_type === "markdown") return [{ type: "markdown", html: marked.parse(source, { async: false }) }];
      if (cell.cell_type === "code") return [{ type: "code", source, outputs: (cell.outputs ?? []).flatMap(output) }];
      return [];
    }),
    contents,
  };
}

/**
 * Import a .ipynb file to get the notebook ready to show, rendered at build time.
 * Figures become files next to the other assets in the build, and data URLs in dev.
 */
export function notebook(): Plugin {
  let build = false;
  let base = "/";
  let assetsDir = "assets";
  return {
    name: "notebook",
    configResolved(config) {
      build = config.command === "build";
      ({ base } = config);
      ({ assetsDir } = config.build);
    },
    transform(code, id) {
      if (!id.endsWith(".ipynb")) return;
      const figure = (data: Buffer, ext: string) => {
        const type = ext === "svg" ? "image/svg+xml" : "image/png";
        if (!build) return `data:${type};base64,${data.toString("base64")}`;
        const fileName = `${assetsDir}/figure-${createHash("sha256").update(data).digest("hex").slice(0, 8)}.${ext}`;
        this.emitFile({ type: "asset", fileName, source: data });
        return base + fileName;
      };
      const notebook = render(JSON.parse(code).cells, figure);
      return { code: `export default ${JSON.stringify(notebook)};`, map: null };
    },
  };
}
