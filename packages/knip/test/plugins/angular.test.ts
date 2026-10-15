import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/angular');

test('Find dependencies with the Angular plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['angular.json']['@angular-devkit/build-angular']);
  assert(issues.unresolved['tsconfig.spec.json']['jasmine']);
  assert(issues.devDependencies['package.json']['karma']);
  assert('src/app/unused.scss' in issues.files);
  assert('src/app/other.component.scss' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 2,
    unlisted: 1,
    unresolved: 1,
    processed: 15,
    total: 15,
  });
});
