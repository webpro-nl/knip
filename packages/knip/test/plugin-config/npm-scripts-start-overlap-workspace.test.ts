import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/npm-scripts-start-overlap-workspace');

test('Reference binary providers in the workspaces that scripts run them in', async () => {
  const { counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(counters, baseCounters);
});

test('Ignore development scripts that run the start script binary in another workspace (production)', async () => {
  const { issues, counters } = await main(await createOptions({ cwd, isProduction: true }));

  assert(issues.dependencies['packages/tools/package.json']?.['test-provider']);
  assert.deepEqual(counters, { ...baseCounters, dependencies: 1 });
});
