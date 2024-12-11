import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/karma');

test('Find dependencies with the Karma plugin (initial config)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['karma.conf.js']['jasmine-core']);

  assert.deepEqual(counters, {
    ...baseCounters,
    //👇 Not 2, as `karma-coverage` should be loaded as plugin by default
    devDependencies: 1,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});
