import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { createOptions } from './helpers/create-options.ts';
import { exec } from './helpers/exec.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config-load-error');

test('Plugin config that throws on load should not be fatal', async () => {
  const options = await createOptions({ cwd });
  await assert.doesNotReject(main(options));
  const { counters } = await main(options);
  assert.equal(counters.processed, 2);
});

test('Plugin config that throws on load exits non-zero via CLI', () => {
  const result = exec('knip --no-progress', { cwd });
  assert.match(result.stderr, /^ERROR: Error loading vite\.config\.ts /m);
  assert.equal(result.status, 1);
});

test('Plugin config that throws on load exits zero with --no-exit-code', () => {
  const result = exec('knip --no-progress --no-exit-code', { cwd });
  assert.match(result.stderr, /^ERROR: Error loading vite\.config\.ts /m);
  assert.equal(result.status, 0);
});
