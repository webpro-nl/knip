import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { default as vue } from '../../src/plugins/vue/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/vue');
const options = buildOptions(cwd);

test('Find dependencies in vue configuration (json)', async () => {
  const configFilePath = join(cwd, 'package.json');
  const dependencies = await vue.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, []);
});

test('Support compiler functions in config (vue)', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
