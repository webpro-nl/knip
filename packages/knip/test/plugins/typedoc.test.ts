import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/typedoc');

test('Find dependencies with the typedoc plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
