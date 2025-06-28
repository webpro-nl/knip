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

  assert(issues.devDependencies['package.json']['karma']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 7,
    total: 7,
  });
});
