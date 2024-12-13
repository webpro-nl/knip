import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/karma3');

test('Find dependencies with the Karma plugin (plugin dependencies)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.ok(issues.unlisted['karma.conf.js']['karma-jasmine']);
  assert.ok(issues.unlisted['karma.conf.js']['karma-coverage']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 2,
    processed: 2,
    total: 2,
  });
});
