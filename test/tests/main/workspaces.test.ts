import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../../src/index.js';
import baseArguments from '../../helpers/baseArguments.js';
import baseCounters from '../../helpers/baseCounters.js';

test('Find unused files, dependencies and exports in workspaces (loose)', async () => {
  const cwd = path.resolve('test/fixtures/workspaces');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  const [file] = Array.from(issues.files);
  assert.match(String(file), /docs\/dangling\.ts$/);

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 1);
  assert.equal(Object.keys(issues.dependencies['apps/a/package.json']).length, 1);

  assert(issues.dependencies['package.json']['unused-dependency']);
  assert(issues.dependencies['apps/a/package.json']['unused-app-dependency']);

  assert.equal(Object.keys(issues.unlisted).length, 1);
  assert(issues.unlisted['apps/b/index.ts']['not-listed']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 2,
    unlisted: 1,
    processed: 5,
    total: 5,
  });
});

test('Find unused files, dependencies and exports in workspaces (strict)', async () => {
  const cwd = path.resolve('test/fixtures/workspaces');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  const [file] = Array.from(issues.files);
  assert.match(String(file), /docs\/dangling\.ts$/);

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 3);
  assert.equal(Object.keys(issues.dependencies['apps/a/package.json']).length, 1);

  assert(issues.dependencies['package.json']['unused-dependency']);
  assert(issues.dependencies['package.json']['root-dependency']);
  assert(issues.dependencies['package.json']['cypress']);
  assert(issues.dependencies['apps/a/package.json']['unused-app-dependency']);

  assert.equal(Object.keys(issues.unlisted).length, 2);
  assert(issues.unlisted['apps/a/index.ts']['root-dependency']);
  assert(issues.unlisted['apps/b/index.ts']['not-listed']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 4,
    unlisted: 2,
    processed: 5,
    total: 5,
  });
});
