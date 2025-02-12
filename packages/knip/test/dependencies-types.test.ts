import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/dependencies-types');

test('Find unused @types dependencies', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@types/ajv']);
  assert(issues.devDependencies['package.json']['@types/eslint__js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    processed: 1,
    total: 1,
  });
});
