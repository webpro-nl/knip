import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/angular3');

test('Find dependencies with the Angular plugin (production vs non-production)', async () => {
  const { issues: nonProdIssues, counters: nonProdCounters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(nonProdIssues.devDependencies['package.json']['@angular/cli']);

  assert.deepEqual(nonProdCounters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 8,
    total: 8,
  });

  const { counters: prodCounters } = await main({
    ...baseArguments,
    isProduction: true,
    cwd,
  });

  assert.deepEqual(prodCounters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});
