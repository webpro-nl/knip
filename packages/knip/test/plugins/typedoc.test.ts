import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/typedoc');

test('Find dependencies with the typedoc plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['typedoc']);
  assert(issues.unlisted['typedoc.json']['@appium/typedoc-plugin-appium']);
  assert(issues.unlisted['typedoc.json']['typedoc-plugin-expand-object-like-types']);
  assert(issues.unlisted['package.json']['typedoc-plugin-umami']);
  assert(issues.unlisted['tsconfig.json']['typedoc-plugin-zod']);
  assert(issues.unresolved['typedoc.json']['./dist/index.cjs']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 4,
    unresolved: 1,
    processed: 0,
    total: 0,
  });
});
