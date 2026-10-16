import { useSyncExternalStore } from "react";

/** The language of the code on the page: the npm package or the Python port */
export type Lang = "js" | "py";

/** The package names, on npm and on PyPI. The versions are the same. */
export const PACKAGES = { js: "@mapequation/c3", py: "c3-colors" };

/** Text in both languages */
export type ByLang = { js: string; py: string };

const KEY = "c3-lang";
const listeners = new Set<() => void>();

function stored(): Lang {
  try {
    return localStorage.getItem(KEY) === "py" ? "py" : "js";
  } catch {
    return "js";
  }
}

let lang = stored();

/** Switch every snippet on the page, and remember the choice for the next visit */
export function setLang(next: Lang) {
  lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Without storage, the choice lasts until the page is closed
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export const useLang = () => useSyncExternalStore(subscribe, () => lang);

/** The text for the language, from plain text that is the same in both or a pair */
export const pick = (text: string | ByLang, lang: Lang) => (typeof text === "string" ? text : text[lang]);
