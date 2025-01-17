import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/angular3');

test('Find dependencies with the Angular plugin (non-production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@angular/cli']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 10,
    total: 10,
  });
});

test('Find dependencies with the Angular plugin (production)', async () => {
  const { counters } = await main({
    ...baseArguments,
    isProduction: true,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});
