import assert from 'node:assert/strict';
import test from 'node:test';
import * as unbuild from '../../src/plugins/unbuild/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';
import type { GenericPluginCallbackOptions } from '../../src/types/plugins.js';

const cwd = resolve('fixtures/plugins/unbuild');
const manifest = getManifest(cwd);

test('Find dependencies in unbuild configuration', async () => {
  const configFilePath = join(cwd, 'build.config.ts');
  const dependencies = await unbuild.findDependencies(configFilePath, {
    manifest,
    config,
  } as GenericPluginCallbackOptions);

  assert.deepEqual(dependencies, []);
});
