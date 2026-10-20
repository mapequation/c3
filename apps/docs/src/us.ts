// The 50 US states and DC in their Census regions and divisions, for the map below
// Quality. The atlas shapes load apart, from usShapes.ts.

type Division = { name: string; region: string; states: string[] };

/** The 9 Census divisions by region, in order */
export const DIVISIONS: Division[] = [
  { region: "Northeast", name: "New England", states: ["CT", "ME", "MA", "NH", "RI", "VT"] },
  { region: "Northeast", name: "Middle Atlantic", states: ["NJ", "NY", "PA"] },
  { region: "Midwest", name: "East North Central", states: ["IL", "IN", "MI", "OH", "WI"] },
  { region: "Midwest", name: "West North Central", states: ["IA", "KS", "MN", "MO", "NE", "ND", "SD"] },
  { region: "South", name: "South Atlantic", states: ["DE", "DC", "FL", "GA", "MD", "NC", "SC", "VA", "WV"] },
  { region: "South", name: "East South Central", states: ["AL", "KY", "MS", "TN"] },
  { region: "South", name: "West South Central", states: ["AR", "LA", "OK", "TX"] },
  { region: "West", name: "Mountain", states: ["AZ", "CO", "ID", "MT", "NV", "NM", "UT", "WY"] },
  { region: "West", name: "Pacific", states: ["AK", "CA", "HI", "OR", "WA"] },
];

/** USPS code and name by FIPS code, the ids in the atlas */
export const FIPS: Record<string, [string, string]> = {
  "01": ["AL", "Alabama"],
  "02": ["AK", "Alaska"],
  "04": ["AZ", "Arizona"],
  "05": ["AR", "Arkansas"],
  "06": ["CA", "California"],
  "08": ["CO", "Colorado"],
  "09": ["CT", "Connecticut"],
  "10": ["DE", "Delaware"],
  "11": ["DC", "District of Columbia"],
  "12": ["FL", "Florida"],
  "13": ["GA", "Georgia"],
  "15": ["HI", "Hawaii"],
  "16": ["ID", "Idaho"],
  "17": ["IL", "Illinois"],
  "18": ["IN", "Indiana"],
  "19": ["IA", "Iowa"],
  "20": ["KS", "Kansas"],
  "21": ["KY", "Kentucky"],
  "22": ["LA", "Louisiana"],
  "23": ["ME", "Maine"],
  "24": ["MD", "Maryland"],
  "25": ["MA", "Massachusetts"],
  "26": ["MI", "Michigan"],
  "27": ["MN", "Minnesota"],
  "28": ["MS", "Mississippi"],
  "29": ["MO", "Missouri"],
  "30": ["MT", "Montana"],
  "31": ["NE", "Nebraska"],
  "32": ["NV", "Nevada"],
  "33": ["NH", "New Hampshire"],
  "34": ["NJ", "New Jersey"],
  "35": ["NM", "New Mexico"],
  "36": ["NY", "New York"],
  "37": ["NC", "North Carolina"],
  "38": ["ND", "North Dakota"],
  "39": ["OH", "Ohio"],
  "40": ["OK", "Oklahoma"],
  "41": ["OR", "Oregon"],
  "42": ["PA", "Pennsylvania"],
  "44": ["RI", "Rhode Island"],
  "45": ["SC", "South Carolina"],
  "46": ["SD", "South Dakota"],
  "47": ["TN", "Tennessee"],
  "48": ["TX", "Texas"],
  "49": ["UT", "Utah"],
  "50": ["VT", "Vermont"],
  "51": ["VA", "Virginia"],
  "53": ["WA", "Washington"],
  "54": ["WV", "West Virginia"],
  "55": ["WI", "Wisconsin"],
  "56": ["WY", "Wyoming"],
};

const NAMES = Object.fromEntries(Object.values(FIPS));
const REGIONS = [...new Set(DIVISIONS.map((d) => d.region))];

/** Each division's path [region, division], 1-based */
export const DIVISION_PATHS = DIVISIONS.map(({ region }, k) => [
  REGIONS.indexOf(region) + 1,
  DIVISIONS.slice(0, k).filter((d) => d.region === region).length + 1,
]);

/** The 51 states in division order, with their division index and path [region, division, state], 1-based */
export const STATES = DIVISIONS.flatMap(({ states }, division) =>
  states.map((code, s) => ({ code, name: NAMES[code] as string, division, path: [...DIVISION_PATHS[division], s + 1] })),
);
