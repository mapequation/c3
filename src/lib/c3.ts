import Node from "./Node";
import * as schemes from "d3-scale-chromatic";
import { hsl } from "d3-color";

export const SCHEME_NAMES = ["rainbow", "sinebow", "turbo", "greys"] as const;
export type Scheme = typeof schemes.interpolateRainbow;
export type SchemeName = typeof SCHEME_NAMES[number];

type C3Props = {
  scheme?: Scheme | SchemeName;
  saturation?: number;
  lightness?: number;
};

export function getColors(
  n: number = 16,
  {
    scheme = schemes.interpolateRainbow,
    saturation = undefined,
    lightness = undefined,
  }: C3Props = {},
) {
  const s = typeof scheme === "string" ? getScheme(scheme) : scheme;
  const colors = getStops(n).map(({ start }) => s(start));

  if (saturation !== null || lightness !== null) {
    colors.forEach((c) => {
      const _hsl = hsl(c);
      _hsl.s = saturation ?? 1.0;
      _hsl.l = lightness ?? 0.5;
      return _hsl?.rgb().toString() ?? "red";
    });
  }

  return colors;
}

/*
 * Generate n color stops on the interval [0, 1].
 */
export function getStops(n: number = 10): Node[] {
  const numLoops = Math.ceil(Math.log2(n));
  const colors = [new Node()];

  for (let i = 0; i < numLoops; ++i) {
    const length = colors.length;
    for (let j = 0; j < length; ++j) {
      const [first, second] = colors[j]!.split();
      colors[j] = first;
      colors.push(second);
      if (colors.length === n) {
        return colors;
      }
    }
  }

  return colors;
}

function getScheme(scheme: SchemeName): Scheme {
  const schemeName = `interpolate${capitalize(scheme)}`;
  // @ts-ignore
  return schemes[schemeName] as any as Scheme;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
