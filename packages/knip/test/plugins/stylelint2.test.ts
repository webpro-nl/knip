import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/stylelint2');

test('Find dependencies with the stylelint plugin (2)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['stylelint-order']);
  assert(issues.unresolved['stylelint.config.js']['stylelint-config-standard']);
  assert(issues.unlisted['stylelint.config.js']['stylelint-config-recommended']);
  assert(issues.unresolved['.stylelintrc.mjs']['stylelint-config-standard']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 1,
    unresolved: 2,
    processed: 4,
    total: 4,
  });
});
