import assert from 'node:assert/strict';
import test from 'node:test';
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
  assert(issues.unlisted['.stylelintrc']['stylelint-config-standard']);
  assert(issues.unlisted['.stylelintrc']['stylelint-order']);
  assert(issues.unlisted['.stylelintrc']['stylelint-config-html/html']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 3,
    processed: 0,
    total: 0,
  });
});
