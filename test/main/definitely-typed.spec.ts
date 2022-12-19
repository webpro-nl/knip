import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = path.resolve('test/fixtures/definitely-typed');

test('Find unused enum and class members', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@types/unused'].symbol, '@types/unused');

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 0,
    devDependencies: 1,
    processed: 2,
    total: 2,
  });
});
