import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';
const cwd = resolve('fixtures/entry/package-entry-points-inferred-root-dir');
test('Resolve package entry points with inferred rootDir spanning src and lib', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues, configurationHints } = await main(options);
  assert.deepEqual(issues.files, {});
  assert.deepEqual(issues.exports, {});
  assert.deepEqual(configurationHints, []);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});
