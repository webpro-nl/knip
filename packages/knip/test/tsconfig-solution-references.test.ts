import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/tsconfig-solution-references');

test('Source-map dist→src when outDir/rootDir live in a referenced tsconfig', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.files).length, 0);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
