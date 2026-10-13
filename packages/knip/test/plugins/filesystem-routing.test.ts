import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

for (const mode of ['default', 'production', 'strict']) {
  test(`Discover filesystem-routing pages and HTTP handlers (${mode})`, async () => {
    const cwd = resolve('fixtures/plugins/filesystem-routing');
    const isStrict = mode === 'strict';
    const isProduction = mode !== 'default';
    const { issues, counters } = await main(await createOptions({ cwd, isStrict, isProduction }));

    assert.deepEqual(Object.keys(issues.files), ['src/orphan.ts']);
    if (isStrict) assert(issues.unlisted['src/routes/__tests__/page.test.ts']['@testing-library/dom']);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: 1,
      unlisted: isStrict ? 1 : 0,
      processed: isProduction ? 8 : 9,
      total: isProduction ? 8 : 9,
    });
  });
}
