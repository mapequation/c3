import { codeToTokensWithThemes, createShikiPrimitive } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import typescript from "shiki/langs/typescript.mjs";
import python from "shiki/langs/python.mjs";
import shellscript from "shiki/langs/shellscript.mjs";
import lightTheme from "shiki/themes/github-light-default.mjs";
import darkTheme from "shiki/themes/github-dark-default.mjs";

/** The languages of the code in the docs */
export type CodeLang = "typescript" | "python" | "shellscript";

/** A line of code as tokens: text with its colors in the light and dark theme, or none for plain text */
export type Line = { text: string; light?: string; dark?: string }[];

// Only the grammars and themes the docs use, with the JavaScript regex engine instead of WASM.
// The primitive tokenizes without the HTML output of a full highlighter, which the docs don't use.
const shiki = createShikiPrimitive({
  themes: [lightTheme, darkTheme],
  langs: [typescript, python, shellscript],
  engine: createJavaScriptRegexEngine(),
});

const themes = { light: lightTheme.name!, dark: darkTheme.name! };
const fg = {
  light: shiki.getTheme(themes.light).fg.toLowerCase(),
  dark: shiki.getTheme(themes.dark).fg.toLowerCase(),
};

/**
 * The code's lines as tokens, for styles.css to color in the page's theme. Plain text keeps the page's text color.
 * A prefix, such as `def ` before a signature, gives the grammar context and is left out.
 */
export function highlight(code: string, lang: CodeLang, prefix = ""): Line[] {
  let skip = prefix.length;
  return codeToTokensWithThemes(shiki, prefix + code, { lang, themes }).map((tokens) => {
    const line: Line = [];
    for (const { content, variants } of tokens) {
      const cut = Math.min(skip, content.length);
      skip -= cut;
      const text = content.slice(cut);
      const light = variants.light.color?.toLowerCase();
      const dark = variants.dark.color?.toLowerCase();
      const color = light === fg.light && dark === fg.dark ? {} : { light, dark };
      const last = line.at(-1);
      if (last && last.light === color.light && last.dark === color.dark) last.text += text;
      else if (text) line.push({ text, ...color });
    }
    return line;
  });
}
