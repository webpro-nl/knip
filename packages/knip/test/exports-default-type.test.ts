import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/export-default-type');

test('Report type of referenced default exports', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(issues.exports['class.js']['default'].symbolType, 'class');
  assert.equal(issues.exports['function.js']['default'].symbolType, 'function');
  assert.equal(issues.exports['var.js']['default'].symbolType, 'variable');
  assert.equal(issues.exports['let.js']['default'].symbolType, 'variable');
  assert.equal(issues.exports['const.js']['default'].symbolType, 'variable');

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 5,
    processed: 6,
    total: 6,
  });
});
