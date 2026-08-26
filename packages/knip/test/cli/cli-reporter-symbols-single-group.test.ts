import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compact-reporter');

test('knip --reporter symbols (single included issue type)', () => {
  const expected = `Unused dependencies (1)
unused-dep  package.json:8:6`;

  const { stdout, stderr } = exec('knip --reporter symbols --include dependencies --strict --no-config-hints', { cwd });
  assert.equal(stderr, '');
  assert.equal(stdout, expected);
});
