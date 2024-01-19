import assert from 'node:assert/strict';
import test from 'node:test';
import { default as eleventy } from '../../src/plugins/eleventy/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/eleventy');
const manifest = getManifest(cwd);

test('Find dependencies in Eleventy configuration (static)', async () => {
  const configFilePath = join(cwd, 'eleventy.config.cjs');
  const dependencies = await eleventy.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, [
    'production:_data/**/*.js',
    'production:**/*.{11ty.js}',
    'production:**/*.11tydata.js',
  ]);
});

test('Find dependencies in Eleventy configuration (dynamic)', async () => {
  const configFilePath = join(cwd, 'eleventy.config.dynamic.cjs');
  const dependencies = await eleventy.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, [
    'production:_data/**/*.js',
    'production:content/**/*.{md,njk,html,liquid}',
    'production:content/**/*.11tydata.js',
    'production:./public/',
    'production:./js/client/script.js',
    './node_modules/prismjs/themes/prism-okaidia.css',
  ]);
});
