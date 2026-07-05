import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-plus');

test('Vite and vitest plugins are enabled with vite-plus dependency', async () => {
  const options = await createOptions({ cwd });
  const { enabledPlugins } = await main(options);

  assert.ok(enabledPlugins['.'].includes('vite'));
  assert.ok(enabledPlugins['.'].includes('vitest'));
});
