import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/filesystem-routing');

for (const isProduction of [false, true]) {
  test(`Find route entries with the filesystem-routing plugin (production: ${isProduction})`, async () => {
    const { issues, counters } = await main(await createOptions({ cwd, isProduction }));

    assert.deepEqual(Object.keys(issues.files), ['src/orphan.ts']);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: 1,
      processed: isProduction ? 4 : 5,
      total: isProduction ? 4 : 5,
    });
  });
}
