import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../src/util/path.js';
import { execFactory } from './helpers/exec.js';

const cwd = resolve('fixtures/module-resolution-non-std');

const exec = execFactory(cwd);

test('knip --reporter markdown', () => {
  const markdown = `# Knip report

## Unused files (1)

* src/unused.ts

## Unlisted dependencies (2)

| Name            | Location     |
|:----------------|:-------------|
| unresolved      | src/index.ts |
| @org/unresolved | src/index.ts |

## Unresolved imports (1)

| Name         | Location     |
|:-------------|:-------------|
| ./unresolved | src/index.ts |

`;
  const out = exec('knip --reporter markdown').stdout;
  assert.equal(out, markdown);
});
