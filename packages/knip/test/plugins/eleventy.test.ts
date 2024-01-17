import assert from 'node:assert/strict';
import test from 'node:test';
import { default as eleventy } from '../../src/plugins/eleventy/index.js';
import { resolve, join } from '../../src/util/path.js';
import { getManifest, pluginConfig as config } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/eleventy');
const manifest = getManifest(cwd);

test('Find dependencies in Eleventy configuration', async () => {
  const configFilePath = join(cwd, 'eleventy.config.cjs');
  const dependencies = await eleventy.findDependencies(configFilePath, { manifest, config });
  assert.deepEqual(dependencies, [
    'entry:_data/**/*.js',
    'entry:**/*.{html,liquid,ejs,md,hbs,mustache,haml,pug,njk,11ty.js}',
    'entry:**/*.11tydata.js',
  ]);
});
