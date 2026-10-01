import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/varlock-production');

test('Find Varlock plugin dependencies in production mode', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert(!issues.dependencies['inactive-staging-plugin']);
  assert(!issues.files['local-plugin.js']);
  assert.deepEqual(counters, { ...baseCounters, processed: 1, total: 1 });
});
