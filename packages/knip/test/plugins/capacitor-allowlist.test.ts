import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/capacitor-allowlist');

test('Respect platform-specific Capacitor plugin allowlists', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.dependencies['package.json']).sort(), ['@capacitor/app', '@capacitor/keyboard']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
  });
});
