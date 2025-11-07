import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/angular2');

test('Find dependencies with the Angular plugin (2)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['karma']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 7,
    total: 7,
  });
});
