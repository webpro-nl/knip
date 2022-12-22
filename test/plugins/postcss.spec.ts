import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../src/index.js';
import * as postcss from '../../src/plugins/postcss/index.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = path.resolve('test/fixtures/plugins/postcss');

test('Unused dependencies in postcss configuration (package.json)', async () => {
  const manifestFilePath = path.join(cwd, 'package.json');
  const manifest = await import(manifestFilePath);
  const dependencies = await postcss.findDependencies(manifestFilePath, { manifest });
  assert.deepEqual(dependencies, ['autoprefixer']);
});

test('Unused dependencies in postcss configuration (postcss.config.js)', async () => {
  const manifestFilePath = path.join(cwd, 'package.json');
  const manifest = await import(manifestFilePath);
  const configFilePath = path.join(cwd, 'postcss.config.js');
  const dependencies = await postcss.findDependencies(configFilePath, { manifest });
  assert.deepEqual(dependencies, []);
});

test('Unused dependencies in postcss configuration (postcss.config.js function)', async () => {
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
