import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/husky-v9');

test('Find dependencies with husky plugin (v9)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['.husky/pre-push']['jest']);
  assert(issues.binaries['.husky/pre-push']['pretty-quick']);
  assert(issues.binaries['.husky/pre-rebase']['eslint']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 3,
    processed: 0,
    total: 0,
  });
});
