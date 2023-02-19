import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../../../src/index.js';
import baseArguments from '../../helpers/baseArguments.js';
import baseCounters from '../../helpers/baseCounters.js';

const cwd = path.resolve('test/fixtures/workspaces-nested');

test('Find unused dependencies in nested workspaces with default config in production mode (loose)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isStrict: false,
    isProduction: true,
  });

  assert(issues.dependencies['level-1-1/level-1-2/level-1-3/package.json']['package-1-3-dev']);
  assert(issues.unlisted['level-1-1/level-1-2/level-1-3/package.json']['ignored-binary-in-level-2']);
  assert(issues.unlisted['level-1-1/level-1-2/index.ts']['ignored-dependency-in-level-3']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 2,
    processed: 3,
    total: 3,
  });
});

test('Find unused dependencies in nested workspaces with default config in production mode (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
    isProduction: true,
  });

  assert(issues.dependencies['level-1-1/level-1-2/level-1-3/package.json']['package-1-3-dev']);
  assert(issues.unlisted['level-1-1/level-1-2/level-1-3/index.ts']['package-1-2']);
  assert(issues.unlisted['level-1-1/level-1-2/level-1-3/package.json']['ignored-binary-in-level-2']);
  assert(issues.unlisted['level-1-1/level-1-2/index.ts']['ignored-dependency-in-level-3']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 3,
    processed: 3,
    total: 3,
  });
});
