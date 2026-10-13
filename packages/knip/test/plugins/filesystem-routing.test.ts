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
      processed: isProduction ? 18 : 19,
      total: isProduction ? 18 : 19,
    });
  });
}

test('Find route entries from the Vite root with the filesystem-routing plugin', async () => {
  const cwd = resolve('fixtures/plugins/filesystem-routing-root');
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.files).sort(), ['pages/unused.ts', 'src/routes/unused.ts']);
  assert.deepEqual(counters, { ...baseCounters, files: 2, processed: 4, total: 4 });
});
