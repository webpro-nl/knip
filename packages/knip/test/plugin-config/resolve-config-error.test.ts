import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/resolve-config-error');

for (const flags of ['', ' --no-exit-code']) {
  test(`Plugin resolveConfig errors exit 2 without findings${flags}`, () => {
    const result = exec(`knip --no-progress${flags}`, { cwd });
    assert.match(result.stderr, /Error loading vite\.config\.ts \([^)]* is not iterable\)/);
    assert.equal(result.status, 2);
  });
}
