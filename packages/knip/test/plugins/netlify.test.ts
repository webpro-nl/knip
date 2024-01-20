import assert from 'node:assert/strict';
import test from 'node:test';
import { default as netlify } from '../../src/plugins/netlify/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/netlify');
const manifest = getManifest(cwd);

test('Find dependencies in netlify configuration (json)', async () => {
  const configFilePath = join(cwd, 'netlify.toml');
  const dependencies = await netlify.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, [
    'netlify-plugin-check-output-for-puppy-references',
    'package-1',
    'package-2',
    'package-3',
    'package-4',
    'production:files/*.md',
    'production:package.json',
    'production:images/**',
    'production:myfunctions/**/*.{js,mjs,cjs,ts,mts,cts}',
  ]);
});
