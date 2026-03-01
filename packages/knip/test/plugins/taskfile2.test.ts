import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

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
