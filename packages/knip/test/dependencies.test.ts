import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/dependencies');

test('Find unused dependencies', async () => {
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

test('Find unused dependencies (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'unused-module.ts')));

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 2);
  assert(issues.dependencies['package.json']['@tootallnate/once']);
  assert(issues.dependencies['package.json']['fs-extra']);
  assert.equal(Object.keys(issues.devDependencies).length, 0);

  assert.equal(Object.keys(issues.binaries).length, 1);
  assert(issues.binaries['package.json']['start-server']);
  assert(!issues.binaries['package.json']['jest']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 2,
    devDependencies: 0,
    binaries: 1,
    processed: 3,
    total: 3,
  });
});

test('Find unused dependencies (strict)', async () => {
  const options = await createOptions({ cwd, isProduction: true, isStrict: true });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'unused-module.ts')));

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 3);
  assert(issues.dependencies['package.json']['@tootallnate/once']);
  assert(issues.dependencies['package.json']['fs-extra']);
  assert(issues.dependencies['package.json']['jquery']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 3,
    binaries: 1,
    processed: 3,
    total: 3,
  });
});
