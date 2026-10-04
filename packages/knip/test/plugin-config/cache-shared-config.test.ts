import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/cache-shared-config');

test('Cached config file shared by multiple plugins keeps the inputs of each plugin', async () => {
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const run = async () => main(await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } }));

  try {
    const counters = { ...baseCounters, processed: 2, total: 2 };
    assert.deepEqual((await run()).counters, counters);
    assert.deepEqual((await run()).counters, counters);
  } finally {
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
