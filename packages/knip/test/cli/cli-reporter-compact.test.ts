import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compact-reporter');

test('knip --reporter compact (with empty issue records after ignore)', () => {
  const { stdout, stderr } = exec('knip --reporter compact', { cwd });
  assert.equal(stderr, '');
  assert.match(stdout, /unused-dep/);
});
