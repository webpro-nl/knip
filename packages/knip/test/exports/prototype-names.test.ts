import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/exports/prototype-names');

test('Report exports named like Object.prototype members', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.exports['module.ts']), ['toString', 'valueOf', 'constructor', '__proto__']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    processed: 2,
    total: 2,
  });
});
