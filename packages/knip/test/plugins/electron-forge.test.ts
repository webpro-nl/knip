import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/electron-forge');

test('Find dependencies and entry files with the Electron Forge plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['src/app/legacy.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 7,
    total: 7,
  });
});
