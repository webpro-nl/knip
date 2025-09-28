import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/angular');

test('Find dependencies with the Angular plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['angular.json']['@angular-devkit/build-angular']);
  assert(issues.unresolved['tsconfig.spec.json']['jasmine']);
  assert(issues.devDependencies['package.json']['karma']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 1,
    unresolved: 1,
    processed: 4,
    total: 4,
  });
});
