import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as postcss from '../../src/plugins/postcss/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { getManifest } from '../helpers/index.js';

const cwd = path.resolve('tests/fixtures/plugins/postcss');
const manifestFilePath = path.join(cwd, 'package.json');
const manifest = getManifest(cwd);

test('Find dependencies in PostCSS configuration (package.json)', async () => {
  const dependencies = await postcss.findDependencies(manifestFilePath, { manifest });
  assert.deepEqual(dependencies, ['autoprefixer']);
});

test('Find dependencies in PostCSS configuration (postcss.config.js)', async () => {
  const configFilePath = path.join(cwd, 'postcss.config.js');
  const dependencies = await postcss.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, []);
});

test('Find dependencies in PostCSS configuration (postcss.config.js function)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['postcss.config.js']['autoprefixer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});
