import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../src/index.ts';
import { join } from '../src/util/path.ts';
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

test('Plugin config load errors are not cached as successful runs', () => {
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));

  try {
    const command = `knip --no-progress --cache --cache-location ${cacheLocation}`;
    const coldResult = exec(command, { cwd });
    const warmResult = exec(command, { cwd });

    assert.match(coldResult.stderr, /^ERROR: Error loading vite\.config\.ts /m);
    assert.match(warmResult.stderr, /^ERROR: Error loading vite\.config\.ts /m);
    assert.equal(coldResult.status, 1);
    assert.equal(warmResult.status, 1);
  } finally {
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
