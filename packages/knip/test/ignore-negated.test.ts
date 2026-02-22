import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/ignore-negated');

test('Support negated ignore patterns', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(resolve('fixtures/ignore-negated/src/modules/B/unusedFileB.js')));
  assert(!issues.files.has(resolve('fixtures/ignore-negated/src/modules/A/unusedFileA.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 3,
  });
});
