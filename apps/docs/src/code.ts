import { presets } from "@mapequation/c3";
import { round } from "./util";

const MAX_LINE = 60;

function format(value: unknown, indent: string): string {
  if (value === presets.mural) return "presets.mural";
  if (typeof value === "number") return String(round(value));
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => format(v, indent)).join(", ")}]`;
  if (value && typeof value === "object") {
    const parts = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${format(v, `${indent}  `)}`);
    if (parts.length === 0) return "{}";
    const line = `{ ${parts.join(", ")} }`;
    if (indent.length + line.length <= MAX_LINE) return line;
    return `{\n${parts.map((p) => `${indent}  ${p},`).join("\n")}\n${indent}}`;
  }
  return String(value);
}

/** Source code for a library call, leaving out an empty options object */
export function callCode(fn: string, ...args: unknown[]) {
  const last = format(args.at(-1), "");
  const shown = last === "{}" ? args.slice(0, -1) : args;
  const call = `${fn}(${shown.map((a) => format(a, "")).join(", ")});`;
  const names = [fn, ...(call.includes("presets.") ? ["presets"] : [])];
  return `import { ${names.join(", ")} } from "@mapequation/c3";\n\n${call}`;
}
