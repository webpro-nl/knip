import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/module-resolution-non-std');

test('knip --reporter markdown', () => {
  const markdown = `# Knip report

## Unused files (1)

| Name          | Location      | Severity |
| :------------ | :------------ | :------- |
| src/unused.ts | src/unused.ts | error    |

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

test('knip --reporter markdown (escape pipes in duplicate exports)', () => {
  const markdown = `# Knip report

## Duplicate exports (1)

| Name                    | Location     | Severity |
| :---------------------- | :----------- | :------- |
| exportedResult\\|default | my-module.ts | error    |`;
  const out = exec('knip --reporter markdown --include duplicates', { cwd: resolve('fixtures/exports/basic') }).stdout;
  assert.equal(out, markdown);
});
