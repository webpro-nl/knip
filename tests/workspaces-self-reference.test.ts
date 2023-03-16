import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';
import { isWindows } from './helpers/index.js';

test('Find unused files, dependencies and exports in workspaces with cross self-references', async () => {
  const cwd = resolve('tests/fixtures/workspaces-self-reference');

  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: isWindows ? 5 : 6, // TODO
    total: isWindows ? 5 : 6, // TODO
  });
});
