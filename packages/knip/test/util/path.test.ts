import { test } from "bun:test";
import assert from "node:assert/strict";
import { cwd, resolve } from "../../src/util/path.js";

test("Should resolve relative paths", () => {
  assert.equal(resolve("./proc.js"), `${cwd}/proc.js`);
});

test("Should resolve absolute paths", () => {
  assert.equal(resolve("/proc.js"), "/proc.js");
});
