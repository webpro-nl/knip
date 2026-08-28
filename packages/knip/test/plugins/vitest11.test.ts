import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vitest11');

test('Find Vitest entries and unused exports behind module promise mocks (11)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/unused.test.ts' in issues.files);
  assert(!('__mocks__/network-client.ts' in issues.files));
  assert(issues.exports['src/pool.ts'].closePool);
  assert(!issues.exports['src/pool.ts'].getPool);
  assert(!issues.exports['src/auto-mocked.ts']);
  assert(!issues.exports['src/import-actual.ts']);
  assert(!issues.exports['src/import-original.ts']);
  assert(!issues.exports['src/shadowed.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 1,
    processed: 12,
    total: 12,
  });
});
