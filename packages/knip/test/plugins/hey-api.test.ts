import { test } from "bun:test";
import assert from "node:assert/strict";
import { main } from "../../src/index.js";
import { resolve } from "../../src/util/path.js";
import baseArguments from "../helpers/baseArguments.js";
import baseCounters from "../helpers/baseCounters.js";

const cwd = resolve("fixtures/plugins/hey-api");

test("Find dependencies with the hey-api plugin", async () => {
  // Ideally, plugin tests have no `issues` left and only `total` and `processed` values in `counters`
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  // TODO: Remove the console.log() before submitting a PR.
  // console.dir(issues, { depth: null });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});
