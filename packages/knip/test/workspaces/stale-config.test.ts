import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces/stale-config');

test('Report config hints for stale workspace configuration keys', async () => {
  const options = await createOptions({ cwd });
  const { configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'workspaces', identifier: 'packages/removed' },
    { type: 'workspaces', identifier: 'apps/*' },
  ]);
});
