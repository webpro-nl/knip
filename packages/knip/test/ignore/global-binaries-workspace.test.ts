import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/ignore/global-binaries-workspace');

test('Apply binary exemptions and explicit ignores in the command workspace', async () => {
  const { issues, counters, configurationHints } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.binaries['.github/workflows/check.yml'] ?? {}), ['node']);
  assert.equal(issues.binaries['.github/workflows/check.yml'].node.workspace, 'packages/checked');
  assert.deepEqual(counters, { ...baseCounters, binaries: 1 });
  assert.deepEqual(configurationHints, []);
});
