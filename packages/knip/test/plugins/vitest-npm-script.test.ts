import assert from 'node:assert/strict';
import test from 'node:test';
import * as vitest from '../../src/plugins/vitest/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/vitest-npm-script');
const manifest = getManifest(cwd);

test('detects the coverage dependency when a npm script activates coverage', async () => {
  const configFilePath = join(cwd, 'vitest.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { cwd, manifest, config });
  assert.deepEqual(dependencies, [
    'entry:**/*.{test,spec}.?(c|m)[jt]s?(x)',
    '@vitest/coverage-v8',
  ]);  
});
