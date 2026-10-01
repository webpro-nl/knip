import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

test('knip --treat-tag-hints-as-errors', () => {
  const cwd = resolve('fixtures/treat-tag-hints-as-errors');
  const result = exec('knip --treat-tag-hints-as-errors', { cwd });
  assert.equal(result.stderr, 'Tag hints (1)\nUnused tag in module.ts: greeting → @internal');
  assert.equal(result.status, 1);
});

test('knip (treatTagHintsAsErrors: true)', () => {
  const cwd = resolve('fixtures/treat-tag-hints-as-errors2');
  const result = exec('knip', { cwd });
  assert.equal(result.stderr, 'Tag hints (1)\nUnused tag in module.ts: greeting → @internal');
  assert.equal(result.status, 1);
});

test('knip (--no-tag-hints overrides)', () => {
  const cwd = resolve('fixtures/treat-tag-hints-as-errors2');
  const result = exec('knip --no-tag-hints', { cwd });
  assert.equal(result.stderr, '');
  assert.equal(result.status, 0);
});
