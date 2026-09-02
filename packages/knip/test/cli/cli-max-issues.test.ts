import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

test('knip --max-issues=abc (invalid value does not disable the exit code)', () => {
  const cwd = resolve('fixtures/compact-reporter');
  const result = exec('knip --max-issues=abc', { cwd });
  assert.equal(result.stderr, 'ERROR: Option --max-issues expects a non-negative integer, got: abc');
  assert.equal(result.status, 2);
});
