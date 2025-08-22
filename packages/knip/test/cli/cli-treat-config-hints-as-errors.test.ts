import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

test('knip --treat-config-hints-as-errors', () => {
  const cwd = resolve('fixtures/treat-config-hints-as-errors');
  const result = exec('knip --treat-config-hints-as-errors', { cwd });
  assert.equal(result.stderr, 'pineapple    package.json  Remove from ignoreDependencies');
  assert.equal(result.status, 1);
});

test('knip (treatConfigHintsAsErrors: true)', () => {
  const cwd = resolve('fixtures/treat-config-hints-as-errors2');
  const result = exec('knip', { cwd });
  assert.equal(result.stderr, 'bananas    package.json  Remove from ignoreDependencies');
  assert.equal(result.status, 1);
});
