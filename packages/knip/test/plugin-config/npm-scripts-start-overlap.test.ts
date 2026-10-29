import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/npm-scripts-start-overlap');

test('Report binaries from development scripts that the start script also runs', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert(issues.binaries['package.json']?.['ephemeral-cli']);
  assert.deepEqual(counters, { ...baseCounters, binaries: 1 });
});

test('Ignore development scripts that the start script repeats (production)', async () => {
  const { counters } = await main(await createOptions({ cwd, isProduction: true }));

  assert.deepEqual(counters, baseCounters);
});
