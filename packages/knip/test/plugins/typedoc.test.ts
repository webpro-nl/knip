import { test } from 'bun:test';
import assert from 'node:assert/strict';
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
  assert(issues.unresolved['typedoc.json']['@appium/typedoc-plugin-appium']);
  assert(issues.unresolved['typedoc.json']['typedoc-plugin-expand-object-like-types']);
  assert(issues.unresolved['package.json']['typedoc-plugin-umami']);
  assert(issues.unresolved['tsconfig.json']['typedoc-plugin-zod']);
  assert(issues.unresolved['typedoc.json']['./dist/index.cjs']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unresolved: 5,
    processed: 0,
    total: 0,
  });
});
