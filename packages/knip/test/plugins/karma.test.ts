import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/karma');

test('Find dependencies with the Karma plugin (initial config)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
