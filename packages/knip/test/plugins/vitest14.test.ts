import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vitest14');

for (const isProduction of [false, true]) {
  test(`Resolve Vite library and Rollup inputs as literal paths (isProduction: ${isProduction})`, async () => {
    const { issues, counters } = await main(await createOptions({ cwd, isProduction }));

    assert(!issues.files['src/library.ts']);
    assert(!issues.files['src/absolute.ts']);
    assert.deepEqual(Object.keys(issues.files).sort(), ['src/p/app.ts', 'src/v/entry.ts']);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: 2,
      processed: isProduction ? 6 : 7,
      total: isProduction ? 6 : 7,
    });
  });
}
