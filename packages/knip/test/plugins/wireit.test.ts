import assert from 'node:assert/strict';
import test from 'node:test';
import * as wireit from '../../src/plugins/wireit/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const wireitPath = resolve('fixtures/plugins/wireit');

async function loadWireitConfig(pathSuffix: string): Promise<string[]> {
  const cwd = join(wireitPath, pathSuffix);
  const manifestFilePath = join(cwd, 'package.json');
  const manifest = getManifest(cwd);

  return wireit.findDependencies(manifestFilePath, {
    manifest,
    config,
    cwd,
    isProduction: false,
    enabledPlugins: [],
  });
}

test('Find no dependencies when the wireit configuration is missing', async () => {
  const dependencies = await loadWireitConfig('apps/missing');
  assert.deepEqual(dependencies, []);
});

test('Find dependencies when the wireit configuration has commands', async () => {
  const dependencies = await loadWireitConfig('apps/withcommands');
  assert.deepEqual(dependencies, ['bin:tsc']);
});

test('Find dependencies in the example wireit configuration', async () => {
  const dependencies = await loadWireitConfig('apps/exampleconfiguration');
  assert.deepEqual(dependencies, ['bin:tsc', 'bin:rollup']);
});
