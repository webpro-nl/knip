import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/stylelint');

test('Find dependencies with the stylelint plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

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
