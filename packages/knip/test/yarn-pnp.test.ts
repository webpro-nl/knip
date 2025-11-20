import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';

test('Find unused dependencies in yarn pnp', async () => {
  const cwd = resolve('fixtures/yarn-pnp/packages/dependencies');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'unused-module.ts')));

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 2);
  assert(issues.dependencies['package.json']['@tootallnate/once']);
  assert(issues.dependencies['package.json']['fs-extra']);
  assert(issues.devDependencies['package.json']['mocha']);

  assert.equal(Object.keys(issues.binaries).length, 1);
  assert(issues.binaries['package.json']['start-server']);
  assert(issues.binaries['package.json']['jest']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 2,
    devDependencies: 1,
    binaries: 2,
    processed: 3,
    total: 3,
  });
});

test('Find unused types dependencies in yarn pnp', async () => {
  const cwd = resolve('fixtures/yarn-pnp/packages/dependencies-types');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.devDependencies['package.json']).length, 2);
  assert(issues.devDependencies['package.json']['@types/ajv']);
  assert(issues.devDependencies['package.json']['@types/eslint__js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
    devDependencies: 2,
  });
});

test('Allow peer dependencies in yarn pnp', async () => {
  const cwd = resolve('fixtures/yarn-pnp/packages/peer-dependencies');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
