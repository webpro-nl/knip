import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/symbol-reporter-directory/packages/config');

test('knip --reporter symbols with --directory from another cwd', () => {
  const expected = `Unused files (2)
packages/client/src/unused.ts
src/unused.ts`;

  const result = exec('knip --directory ../.. --reporter symbols --include files --no-config-hints', { cwd }).stdout;

  assert.equal(result, expected);
});
