import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/dependencies-types');

test('Find unused @types dependencies', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['@types/ajv']);
  assert(issues.devDependencies['package.json']['@types/eslint__js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 2,
    processed: 1,
    total: 1,
  });
});
