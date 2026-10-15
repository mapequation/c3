/**
 * Named color sets, for seeds or for a tone to match.
 */
export const swatches = {
  /** Englewood mural, five colors picked with an Illustrator plugin */
  mural: ["#afb581", "#efab6a", "#e78c6e", "#838eab", "#c4c0d5"],
} as const satisfies Record<string, readonly string[]>;
