import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-exports-used-in-file-id-underscores');

test('Find unused exports when identifiers begin with two underscores', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.exports['imported.ts']['__underscoresUnused'].symbol, '__underscoresUnused');
  assert.equal(issues.exports['namespace.ts']['NS.__underscoresUnused'].symbol, '__underscoresUnused');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    processed: 3,
    total: 3,
  });
});
