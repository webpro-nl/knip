import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/jsdoc-exports');

test('Find exports from jsdoc @type tags', async () => {
  const options = await createOptions({ cwd, tags: ['-ignoreunresolved'] });
  const { issues, counters } = await main(options);

  assert(issues.exports['module.ts']['alphaFn']);
  assert(issues.exports['module.ts']['internalUnusedFn']);
  assert(issues.exports['module.ts']['invalidTaggedFn']);
  assert(issues.exports['module.ts']['unusedFn']);

  assert(issues.types['module.ts']['UnusedInterface']);
  assert(issues.types['module.ts']['InternalWithLineComment']);
  assert(!issues.types['module.ts']['UsedViaJSDoc']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    types: 2,
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

  assert(issues.types['module.ts']['UnusedInterface']);
  assert(issues.types['module.ts']['UsedViaJSDoc']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    types: 2,
    processed: 2,
    total: 2,
  });
});

test('JSDoc tag with line comment between tag and export is respected', async () => {
  const options = await createOptions({ cwd, tags: ['-internal', '-ignoreunresolved'] });
  const { issues, counters } = await main(options);

  assert(!issues.types['module.ts']['InternalWithLineComment']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    types: 1,
    processed: 3,
    total: 3,
  });
});
