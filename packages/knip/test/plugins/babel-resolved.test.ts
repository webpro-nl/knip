import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/babel-resolved');

test('Ignore Babel plugins resolved into dependencies of another package', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['babel.config.js']['babel-plugin-macros']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 1,
    total: 1,
  });
});
