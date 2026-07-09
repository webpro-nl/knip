import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-plus');

test('Vite, vitest and vite-plus plugins are enabled with vite-plus dependency', async () => {
  const options = await createOptions({ cwd });
  const { enabledPlugins } = await main(options);

  assert.ok(enabledPlugins['.'].includes('vite'));
  assert.ok(enabledPlugins['.'].includes('vitest'));
  assert.ok(enabledPlugins['.'].includes('vite-plus'));
});

test('Resolve run.tasks and staged scripts from the vite-plus config', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!('scripts/build-sprite.ts' in issues.files));
  assert(!('scripts/check-format.ts' in issues.files));
});
