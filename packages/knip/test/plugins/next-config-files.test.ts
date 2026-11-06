import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/next-config-files');

for (const isProduction of [false, true]) {
  test(`Find image loader and cache handler files in Next.js config (production: ${isProduction})`, async () => {
    const options = await createOptions({ cwd, isProduction });
    const { issues, counters, hasConfigLoadErrors } = await main(options);

    assert.equal(hasConfigLoadErrors, false);
    assert.deepEqual(Object.keys(issues.files), ['unused.ts']);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: 1,
      processed: isProduction ? 5 : 6,
      total: isProduction ? 5 : 6,
    });
  });
}
