import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/electron-forge');

test('Find dependencies and literal entry files with the Electron Forge plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['src/app/legacy.ts', 'src/app/v/window.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 9,
    total: 9,
  });
});
