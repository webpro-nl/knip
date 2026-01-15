import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/dts-compiled');

test('Include compiled files referred by the declaration files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'src/UnusedQuery.graphql')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 8,
    total: 8,
  });
});
