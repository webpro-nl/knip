import { test } from "bun:test";
import assert from "node:assert/strict";
import { main as knip } from "../src/index.js";
import { resolve } from "../src/util/path.js";
import baseArguments from "./helpers/baseArguments.js";
import { noIssuesReported } from "./helpers/noIssuesReported.js";

const cwd = resolve("fixtures/import-star-iteration");

test("Handle usage of members of a namespace when imported using * and iterating", async () => {
  const { issues } = await knip({
    ...baseArguments,
    cwd,
  });

  // Classes Orange and Apple are both used using a for (...in) loop
  // Classes Broccoli and Spinach are both used using a for (...of) loop
  assert(noIssuesReported(issues));
});
