import { feature, merge, mesh } from "topojson-client";
import atlas from "us-atlas/states-albers-10m.json";
import { DIVISIONS, FIPS, STATES } from "./us";

// The states from us-atlas, already projected to Albers USA on 975×610 with Alaska and
// Hawaii as insets, as SVG paths. Loaded apart from the page by UsMap.tsx.

type Topology = Parameters<typeof feature>[0];
type Geometry = { type: string; coordinates?: unknown };
type Collection = Parameters<typeof mesh>[1] & { geometries: { id?: string | number }[] };

const topology = atlas as Topology;
const all = (topology.objects.states as Collection).geometries;
// Only the 50 states and DC, in the order of STATES
const byCode = new Map(all.filter(({ id }) => FIPS[id!]).map((g) => [FIPS[g.id!][0], g]));
const geometries = STATES.map(({ code }) => byCode.get(code)!);
const states = { type: "GeometryCollection", geometries } as Collection;
const division = new Map(geometries.map((g, i) => [g, STATES[i].division]));

const round = (v: number) => Math.round(v * 10) / 10;

/** A polygon, multipolygon or multilinestring as path data; rings close, lines don't */
function pathData({ type, coordinates }: Geometry, close: boolean) {
  const lines = (type === "MultiPolygon" ? (coordinates as number[][][][]).flat() : coordinates) as number[][][];
  return lines.map((line) => `M${line.map(([x, y]) => `${round(x)},${round(y)}`).join("L")}${close ? "Z" : ""}`).join("");
}

export const shapes = {
  /** One path per state, in the order of STATES */
  states: geometries.map((g) => pathData((feature(topology, g as never) as { geometry: Geometry }).geometry, true)),
  /** One path per division, its states merged */
  divisions: DIVISIONS.map((_, k) => pathData(merge(topology, geometries.filter((g) => division.get(g) === k) as never), true)),
  /** The inner borders between states, drawn at both levels */
  borders: pathData(mesh(topology, states, (a, b) => a !== b), false),
};

export type Shapes = typeof shapes;
