import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/jsdoc-exports');

test('Find exports from jsdoc @type tags', async () => {
  const options = await createOptions({ cwd, tags: ['-ignoreunresolved'] });
  const { issues, counters } = await main(options);

  assert(issues.exports['module.ts']['alphaFn']);
  assert(issues.exports['module.ts']['internalUnusedFn']);
  assert(issues.exports['module.ts']['invalidTaggedFn']);
  assert(issues.exports['module.ts']['unusedFn']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    processed: 3,
    total: 3,
  });
});

test('Find exports from jsdoc @type tags (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true, tags: ['-ignoreunresolved'] });
  const { issues, counters } = await main(options);

  assert(issues.exports['module.ts']['alphaFn']);
  assert(issues.exports['module.ts']['invalidTaggedFn']);
  assert(issues.exports['module.ts']['unusedFn']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    processed: 2,
    total: 2,
  });
});
