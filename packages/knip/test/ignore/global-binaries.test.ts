import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/ignore/global-binaries');

test('Report global binaries while preserving installed providers, optional inputs and explicit ignores', async () => {
  const { issues, counters, configurationHints } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.binaries['package.json'] ?? {}).sort(), ['docker', 'node']);
  assert.deepEqual(counters, { ...baseCounters, binaries: 2 });
  assert.deepEqual(configurationHints, [{ type: 'ignoreBinaries', workspaceName: '.', identifier: 'unused-ignore' }]);
});
