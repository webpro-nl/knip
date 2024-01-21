import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { default as wireit } from '../../src/plugins/wireit/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/wireit');

test('Find no dependencies when the wireit configuration is missing', async () => {
  const dir = join(cwd, 'apps/missing');
  const configFilePath = join(dir, 'package.json');
  const options = buildOptions(dir);
  const dependencies = await wireit.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, []);
});

test('Find dependencies when the wireit configuration has commands', async () => {
  const configFilePath = join(cwd, 'package.json');
  const options = buildOptions(cwd);
  const dependencies = await wireit.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['bin:tsc']);
});

test('Find dependencies in the example wireit configuration', async () => {
  const dir = join(cwd, 'apps/example-configuration');
  const configFilePath = join(dir, 'package.json');
  const options = buildOptions(dir);
  const dependencies = await wireit.findDependencies(configFilePath, options);
  assert.deepEqual(dependencies, ['bin:tsc', 'bin:rollup']);
});

test('Find dependencies in wireit configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['package.json']['tsc']);
  assert(issues.binaries['apps/example-configuration/package.json']['rollup']);
  assert(issues.binaries['apps/example-configuration/package.json']['tsc']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 3,
    devDependencies: 0,
    processed: 0,
    total: 0,
  });
});
