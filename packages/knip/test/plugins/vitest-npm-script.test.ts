import assert from 'node:assert/strict';
import test from 'node:test';
import { default as vitest } from '../../src/plugins/vitest/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/vitest-npm-script');
const manifest = getManifest(cwd);
const enabledPlugins = ['vitest'];

test('detects the coverage dependency when a npm script activates coverage', async () => {
  const configFilePath = join(cwd, 'vitest.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { cwd, manifest, config, enabledPlugins });
  assert.deepEqual(dependencies, ['entry:**/*.{test,test-d,spec}.?(c|m)[jt]s?(x)', '@vitest/coverage-v8']);
});
