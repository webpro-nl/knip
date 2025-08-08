import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/ignore-exports-used-in-file-id-underscores');

test('Find unused exports when identifiers begin with two underscores', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.exports['imported.ts']['__underscoresUnused'].symbol, '__underscoresUnused');
  assert.equal(issues.exports['namespace.ts']['NS.__underscoresUnused'].symbol, '__underscoresUnused');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 3,
    total: 3,
  });
});
