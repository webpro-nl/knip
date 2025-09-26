import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter markdown', () => {
  const markdown = `# Knip report

## Unused files (1)

* src/unused.ts

## Unlisted dependencies (2)

| Name            | Location           | Severity |
| :-------------- | :----------------- | :------- |
| @org/unresolved | src/index.ts:10:27 | error    |
| unresolved      | src/index.ts:9:27  | error    |

## Unresolved imports (1)

| Name         | Location          | Severity |
| :----------- | :---------------- | :------- |
| ./unresolved | src/index.ts:8:24 | error    |`;
  const out = exec('knip --reporter markdown', { cwd }).stdout;
  assert.equal(out, markdown);
});
