import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/next-turbopack-loaders');

for (const isProduction of [false, true]) {
  test(`Find Next.js Turbopack loaders and alias targets (production: ${isProduction})`, async () => {
    const options = await createOptions({ cwd, isProduction, isIncludeEntryExports: true });
    const { issues, counters } = await main(options);

    assert.deepEqual(issues.dependencies, {});
    assert.deepEqual(
      Object.keys(issues.files).sort(),
      isProduction ? ['loaders/server.cjs', 'unused.ts'] : ['unused.ts']
    );
    if (!isProduction) assert.deepEqual(Object.keys(issues.devDependencies['package.json']), ['unused-loader']);
    assert.deepEqual(counters, {
      ...baseCounters,
      devDependencies: isProduction ? 0 : 1,
      files: isProduction ? 2 : 1,
      processed: isProduction ? 6 : 7,
      total: isProduction ? 6 : 7,
    });
  });
}
