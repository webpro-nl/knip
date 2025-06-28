import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/prettier');

test('Find dependencies with the Prettier plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['prettier']);
  assert(issues.unlisted['.prettierrc']['prettier-plugin-xml']);
  assert(issues.unresolved['package.json']['@company/prettier-config']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 1,
    unresolved: 1,
    processed: 0,
    total: 0,
  });
});
