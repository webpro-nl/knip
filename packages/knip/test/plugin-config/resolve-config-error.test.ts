import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/resolve-config-error');

test('Plugin resolveConfig errors exit 2 without findings', () => {
  const result = exec('knip --no-progress', { cwd });
  assert.match(result.stderr, /Error loading vite\.config\.ts \([^)]* is not iterable\)/);
  assert.equal(result.status, 2);
});

test('Plugin resolveConfig errors exit 2 without findings even with --no-exit-code', () => {
  const result = exec('knip --no-progress --no-exit-code', { cwd });
  assert.match(result.stderr, /Error loading vite\.config\.ts \([^)]* is not iterable\)/);
  assert.equal(result.status, 2);
});
