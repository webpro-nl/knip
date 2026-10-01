import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/reporter-markdown-short');

test('knip --reporter markdown (short values align to header width)', () => {
  const markdown = `# Knip report

## Unused exported types (1)

| Name | Location      | Severity |
| :--- | :------------ | :------- |
| B    | types.ts:2:13 | error    |`;
  const out = exec('knip --reporter markdown', { cwd }).stdout;
  assert.equal(out, markdown);
});
