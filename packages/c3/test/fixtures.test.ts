import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fixtureCases, fixtureDifferences, serializeFixtures } from "./fixtures.js";

const file = new URL("../../../fixtures/c3.json", import.meta.url);
const regenerate = "run `pnpm --filter @mapequation/c3 fixtures` to regenerate it";

describe("shared fixtures", () => {
  it("fixtures/c3.json is up to date", () => {
    const text = serializeFixtures(fixtureCases());
    if (process.env.UPDATE_FIXTURES) {
      writeFileSync(file, text);
      return;
    }
    if (!existsSync(file)) throw new Error(`${fileURLToPath(file)} is missing; ${regenerate}`);
    const differences = fixtureDifferences(JSON.parse(text), JSON.parse(readFileSync(file, "utf8")));
    expect(differences, `fixtures/c3.json is stale; ${regenerate}`).toEqual([]);
  });
});
