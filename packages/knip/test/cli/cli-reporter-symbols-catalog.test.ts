import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const cwd = resolve('fixtures/catalog-pnpm');

test('knip --reporter symbols (catalog)', () => {
  const expected = `Unused catalog entries (1)
lodash  default  pnpm-workspace.yaml`;

  const result = exec('knip --reporter symbols', { cwd }).stdout;

  assert.equal(result, expected);
});
