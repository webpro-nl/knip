import assert from 'node:assert/strict';
import test from 'node:test';
import { default as netlify } from '../../src/plugins/netlify/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/netlify');
const manifest = getManifest(cwd);

test('Find dependencies in netlify configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await netlify.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, []);
});
