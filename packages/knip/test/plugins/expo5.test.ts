import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/expo5');

test('Find dependencies with the Expo plugin (5)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/app/unused.ts' in issues.files);
  assert(issues.exports['src/app/App.tsx']['unusedHelper']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 1,
    processed: 4,
    total: 4,
  });
});
