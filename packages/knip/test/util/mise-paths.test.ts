import assert from 'node:assert/strict';
import test from 'node:test';
import mise from '../../src/plugins/mise/index.ts';
import { createManifest } from '../../src/util/package-json.ts';

test('Keep normalized Windows task paths and explicit entry files rooted in their task directory', async () => {
  const directories: (string | undefined)[] = [];
  assert(mise.resolveConfig);
  const inputs = await mise.resolveConfig(
    { tasks: { check: { dir: 'packages/web', run: './scripts/check.ts' } } },
    {
      cwd: 'C:/project',
      rootCwd: 'C:/project',
      manifest: createManifest({}),
      rootManifest: undefined,
      getManifest: () => undefined,
      config: { config: null, entry: null, project: null },
      configFileDir: 'C:/project/.config/mise',
      configFileName: 'config.toml',
      configFilePath: 'C:/project/.config/mise/config.toml',
      isProduction: false,
      enabledPlugins: ['mise'],
      getInputsFromScripts: (_scripts, options) => {
        directories.push(options?.cwd);
        return [{ type: 'entry', specifier: './scripts/check.ts' }];
      },
    }
  );

  assert.deepEqual(directories, ['C:/project/packages/web']);
  assert.deepEqual(inputs, [
    { type: 'entry', specifier: 'C:/project/packages/web/scripts/check.ts', dir: 'C:/project/packages/web' },
  ]);
});
