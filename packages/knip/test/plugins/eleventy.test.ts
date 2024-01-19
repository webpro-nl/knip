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
  assert.deepEqual(dependencies, ['entry:_data/**/*.js', 'entry:**/*.{11ty.js}', 'entry:**/*.11tydata.js']);
});

test('Find dependencies in Eleventy configuration (dynamic)', async () => {
  const configFilePath = join(cwd, 'eleventy.config.dynamic.cjs');
  const dependencies = await eleventy.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, [
    'entry:_data/**/*.js',
    'entry:content/**/*.{md,njk,html,liquid}',
    'entry:content/**/*.11tydata.js',
    'entry:./public/',
    'entry:./js/client/script.js',
    './node_modules/prismjs/themes/prism-okaidia.css',
  ]);
});
