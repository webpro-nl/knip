import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/dts-compiled');

test('Include compiled files referred by the declaration files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/UnusedQuery.graphql' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 8,
    total: 8,
  });
});
