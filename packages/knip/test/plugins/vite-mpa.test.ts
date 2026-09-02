import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-mpa');

test('Find module entries from nested Vite multi-page index.html files', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.equal(issues.files['nested/nested-entry.ts'], undefined);
  assert.equal(issues.files['pages/admin.ts'], undefined);
  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    binaries: 1,
    processed: 3,
    total: 3,
  });
});
