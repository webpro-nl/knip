import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/taskfile2');

test('Find dependencies with custom taskfile path patterns', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['custom-taskfile.yml']['jest']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 3,
    total: 3,
  });
});
