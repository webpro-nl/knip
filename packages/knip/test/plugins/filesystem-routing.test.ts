import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/filesystem-routing');

const unused = ['src/empty/home.tsx', 'src/orphan.ts', 'src/pages/excluded.ts'];

for (const isProduction of [false, true]) {
  test(`Find route entries with the filesystem-routing plugin (production: ${isProduction})`, async () => {
    const { issues, counters } = await main(await createOptions({ cwd, isProduction }));

    assert.deepEqual(Object.keys(issues.files).sort(), unused);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: unused.length,
      processed: isProduction ? 17 : 18,
      total: isProduction ? 17 : 18,
    });
  });
}
