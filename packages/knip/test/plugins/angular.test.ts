import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/angular');

test('Find dependencies with the Angular plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['angular.json']['@angular-devkit/build-angular']);
  assert(issues.unlisted['tsconfig.spec.json']['jasmine']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
    processed: 1,
    total: 1,
  });
});
