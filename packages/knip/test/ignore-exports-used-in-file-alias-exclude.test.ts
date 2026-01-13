import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-exports-used-in-file-alias-exclude');

test('Find unused exports respecting an ignoreExportsUsedInFile (alias)', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    processed: 3,
    total: 3,
  });

  assert(issues.exports['exports.ts']['ash']);
  assert(issues.exports['more.ts']['kauri']);
  assert(issues.exports['more.ts']['larch']);
});
