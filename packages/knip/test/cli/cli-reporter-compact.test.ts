import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compact-reporter');

test('knip --reporter compact (with empty issue records after ignore)', () => {
  const expected = `Unused dependencies (1)
package.json: unused-dep`;

  const { stdout, stderr } = exec('knip --reporter compact', { cwd });
  assert.equal(stderr, '');
  assert.equal(stdout, expected);
});

test('knip --reporter compact (single included issue type)', () => {
  const expected = `Unused dependencies (1)
package.json: unused-dep`;

  const { stdout, stderr } = exec('knip --reporter compact --include dependencies --strict --no-config-hints', { cwd });
  assert.equal(stderr, '');
  assert.equal(stdout, expected);
});
