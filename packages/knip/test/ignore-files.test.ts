import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/ignore-files');

test('Respect ignored files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('apples/rooted.js' in issues.files);
  assert('unused.js' in issues.files);

  assert(issues.exports['apples/used.js'].unused);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    exports: 1,
    processed: 8,
    total: 12,
  });
});
