import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/workspaces');

test('Find unused files, dependencies and exports in workspaces (default)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'docs/dangling.ts')));

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 2);
  assert.equal(Object.keys(issues.dependencies['apps/backend/package.json']).length, 2);

  assert(issues.dependencies['package.json']['minimist']);
  assert(issues.dependencies['package.json']['zod']);
  assert(issues.dependencies['apps/backend/package.json']['next']);
  assert(issues.dependencies['apps/backend/package.json']['picomatch']);

  assert.equal(Object.keys(issues.unlisted).length, 3);
  assert(issues.unlisted['apps/frontend/index.ts']['vanilla-js']);
  assert(issues.unlisted['apps/backend/index.ts']['globby']);
  assert(issues.unlisted['apps/backend/index.ts']['js-yaml']);
  assert(issues.unlisted['packages/tools/tsconfig.json']['@workspaces/tsconfig']);

  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 1,
    types: 1,
    dependencies: 4,
    unlisted: 4,
    processed: 7,
    total: 7,
  });
});

test('Find unused files, dependencies and exports in workspaces (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert(issues.files.has(join(cwd, 'docs/dangling.ts')));

  assert.equal(Object.keys(issues.dependencies['package.json']).length, 3);
  assert.equal(Object.keys(issues.dependencies['apps/backend/package.json']).length, 2);

  assert(issues.dependencies['package.json']['cypress']);
  assert(issues.dependencies['package.json']['minimist']);
  assert(issues.dependencies['package.json']['zod']);
  assert(issues.dependencies['apps/backend/package.json']['next']);
  assert(issues.dependencies['apps/backend/package.json']['picomatch']);

  assert.equal(Object.keys(issues.unlisted).length, 2);
  assert(issues.unlisted['apps/frontend/index.ts']['vanilla-js']);
  assert(issues.unlisted['apps/backend/index.ts']['globby']);
  assert(issues.unlisted['apps/backend/index.ts']['js-yaml']);

  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 1,
    types: 1,
    dependencies: 5,
    unlisted: 3,
    processed: 7,
    total: 7,
  });
});

test('Analyze only ancestor and dependent workspaces', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    workspace: 'packages/shared',
  });

  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 1,
    processed: 4,
    total: 4,
  });
});
