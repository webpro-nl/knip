import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/catalog-pnpm');

test('knip --reporter symbols (catalog)', () => {
  const expected = `Unused catalog entries (1)
lodash  default  pnpm-workspace.yaml:7:3`;

  const result = exec('knip --reporter symbols', { cwd }).stdout;

  assert.equal(result, expected);
});
