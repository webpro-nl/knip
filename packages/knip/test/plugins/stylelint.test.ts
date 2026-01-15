import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/stylelint');

test('Find dependencies with the stylelint plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['stylelint']);
  assert(issues.unresolved['.stylelintrc']['postcss-less']);
  assert(issues.unresolved['.stylelintrc']['stylelint-config-standard']);
  assert(issues.unresolved['.stylelintrc']['stylelint-order']);
  assert(issues.unresolved['.stylelintrc']['stylelint-config-html/html']);
  assert(issues.unresolved['.stylelintrc']['./myExtendableConfig']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unresolved: 5,
    processed: 0,
    total: 0,
  });
});
