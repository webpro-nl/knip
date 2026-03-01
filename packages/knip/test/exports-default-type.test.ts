import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/export-default-type');

test('Report type of referenced default exports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
