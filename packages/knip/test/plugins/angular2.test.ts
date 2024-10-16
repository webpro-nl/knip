import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/angular2');

test('Find dependencies with the Angular plugin (2)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['angular.json']['tsconfig.spec.json']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 2,
    total: 2,
  });
});
