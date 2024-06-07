import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/module-resolution-non-std');

const exec = execFactory(cwd);

test('knip --reporter markdown', () => {
  const markdown = `# Knip report

## Unused files (1)

* src/unused.ts

## Unlisted dependencies (2)

| Name            | Location     | Severity |
| :-------------- | :----------- | :------- |
| @org/unresolved | src/index.ts | error    |
| unresolved      | src/index.ts | error    |

## Unresolved imports (1)

| Name         | Location          | Severity |
| :----------- | :---------------- | :------- |
| ./unresolved | src/index.ts:8:23 | error    |

`;
  const out = exec('knip --reporter markdown').stdout;
  assert.equal(out, markdown);
});
