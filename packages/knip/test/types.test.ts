import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/types');

test('Find @types/pkg that are obsolete, since pkg has types included', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['@types/webpack']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});
