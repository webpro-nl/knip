import assert from 'node:assert/strict';
import test from 'node:test';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/session/create-options-configuration');

test('Keep default project file patterns in a session when configuration is provided', async () => {
  const options = await createOptions({ cwd, isSession: true, configuration: { entry: ['index.ts'] } });

  assert.equal(options.isUseTscFiles, false);
  assert.deepEqual(options.parsedConfig, { entry: ['index.ts'] });
});