import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../../src/index.js';
import baseArguments from '../../helpers/baseArguments.js';
import baseCounters from '../../helpers/baseCounters.js';

test('Find unused dependencies', async () => {
  const cwd = path.resolve('test/fixtures/dependencies');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(Array.from(issues.files)[0].endsWith('unused-module.ts'));

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 3);
  assert(issues.dependencies['package.json']['@tootallnate/once']);
  assert(issues.dependencies['package.json']['jquery']);
  assert(issues.dependencies['package.json']['fs-extra']);
  assert(!issues.dependencies['package.json']['mocha']);
  assert(issues.devDependencies['package.json']['mocha']);

  assert.equal(Object.keys(issues.unlisted).length, 3);
  assert(issues.unlisted['my-module.ts']['ansi-regex']);
  assert(issues.unlisted['entry.ts']['not-exist']);
  assert(issues.unlisted['package.json']['server']);
  assert(issues.unlisted['package.json']['jest']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 3,
    devDependencies: 1,
    unlisted: 4,
    processed: 4,
    total: 4,
  });
});

test('Find unused dependencies (production/strict)', async () => {
  const cwd = path.resolve('test/fixtures/dependencies');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert(Array.from(issues.files)[0].endsWith('unused-module.ts'));

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 3);
  assert(issues.dependencies['package.json']['@tootallnate/once']);
  assert(issues.dependencies['package.json']['jquery']);
  assert(issues.dependencies['package.json']['fs-extra']);
  assert(!issues.dependencies['package.json']['mocha']);
  assert.equal(Object.keys(issues.devDependencies).length, 0);

  assert.equal(Object.keys(issues.unlisted).length, 3);
  assert(issues.unlisted['my-module.ts']['ansi-regex']);
  assert(issues.unlisted['entry.ts']['not-exist']);
  assert(issues.unlisted['package.json']['server']);
  assert(!issues.unlisted['package.json']['jest']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 3,
    devDependencies: 0,
    unlisted: 3,
    processed: 3,
    total: 3,
  });
});
