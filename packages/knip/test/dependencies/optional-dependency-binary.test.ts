import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/optional-dependency-binary');
const installedCwd = resolve('fixtures/dependencies/optional-dependency-binary-installed');

test('Do not report an absent optional dependency as an unlisted binary when names match', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.binaries['package.json'] ?? {}), []);
  assert.deepEqual(counters, { ...baseCounters, processed: 0, total: 0 });
});

test('Report an installed optional dependency that does not provide the referenced binary', async () => {
  const { issues, counters } = await main(await createOptions({ cwd: installedCwd }));

  assert.deepEqual(Object.keys(issues.binaries['package.json'] ?? {}), ['optional']);
  assert.deepEqual(counters, { ...baseCounters, binaries: 1, processed: 0, total: 0 });
});
