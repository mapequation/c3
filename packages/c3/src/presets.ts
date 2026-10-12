/**
 * Seed colors for extend() and palette({ like }).
 */
export const presets = {
  /** Englewood mural, five colors picked with an Illustrator plugin */
  mural: ["#afb581", "#efab6a", "#e78c6e", "#838eab", "#c4c0d5"],
} as const satisfies Record<string, readonly string[]>;
