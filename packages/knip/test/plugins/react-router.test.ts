import { test } from "bun:test";
import assert from "node:assert/strict";
import { main } from "../../src/index.js";
import { resolve } from "../../src/util/path.js";
import baseArguments from "../helpers/baseArguments.js";
import baseCounters from "../helpers/baseCounters.js";

const cwd = resolve("fixtures/plugins/react-router");

test("Find dependencies with the react-router plugin", async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 8,
    total: 8,
  });
});
