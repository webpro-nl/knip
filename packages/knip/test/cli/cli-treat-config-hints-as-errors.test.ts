import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

test('knip --treat-config-hints-as-errors', () => {
  const cwd = resolve('fixtures/treat-config-hints-as-errors');
  const result = exec('knip --treat-config-hints-as-errors', { cwd });
  assert.equal(result.stderr, 'Configuration hints (1)\npineapple    package.json  Remove from ignoreDependencies');
  assert.equal(result.status, 1);
});

test('knip (treatConfigHintsAsErrors: true)', () => {
  const cwd = resolve('fixtures/treat-config-hints-as-errors2');
  const result = exec('knip', { cwd });
  assert.equal(result.stderr, 'Configuration hints (1)\nbananas    package.json  Remove from ignoreDependencies');
  assert.equal(result.status, 1);
});

test('knip (production)', () => {
  const cwd = resolve('fixtures/treat-config-hints-as-errors2');
  const result = exec('knip --production', { cwd });
  assert.equal(result.stderr, '');
  assert.equal(result.status, 0);
});
