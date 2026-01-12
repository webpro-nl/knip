import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/workspaces');

test('Select workspace by package name', async () => {
  const options = await createOptions({ cwd, workspace: '@fixtures/workspaces__shared' });
  const { issues, counters } = await main(options);

  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 1,
    processed: 4,
    total: 4,
  });
});

test('Select workspaces by package name glob with brace expansion', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['@fixtures/workspaces__{shared,backend}'],
  });
  const { issues, counters } = await main(options);

  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);
  assert(issues.unlisted['apps/backend/index.ts']['globby']);
  assert(issues.unlisted['apps/backend/index.ts']['js-yaml']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 1,
    dependencies: 2,
    unlisted: 2,
    processed: 4,
    total: 4,
  });
});

test('Select workspaces by package name with wildcard', async () => {
  const options = await createOptions({
    cwd,
    workspace: '@fixtures/workspaces__*',
  });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'docs/dangling.ts')));
  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);

  // Should include all workspaces
  assert(counters.total === 7);
});

test('Select workspaces by directory glob pattern', async () => {
  const options = await createOptions({
    cwd,
    workspace: './apps/*',
  });
  const { issues, includedWorkspaceDirs, selectedWorkspaces } = await main(options);

  // Should only include apps/frontend and apps/backend
  assert(issues.unlisted['apps/frontend/index.ts']['vanilla-js']);
  assert(issues.unlisted['apps/backend/index.ts']['globby']);
  assert(issues.unlisted['apps/backend/index.ts']['js-yaml']);
  assert(issues.dependencies['apps/backend/package.json']['next']);
  assert(issues.dependencies['apps/backend/package.json']['picomatch']);
  assert(includedWorkspaceDirs.includes(join(cwd, 'apps/frontend')));
  assert(includedWorkspaceDirs.includes(join(cwd, 'apps/backend')));
  assert(selectedWorkspaces?.includes('apps/frontend'));
  assert(selectedWorkspaces?.includes('apps/backend'));
});

test('Exclude workspace by package name', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['@fixtures/workspaces__*', '!@fixtures/workspaces__tools'],
  });
  const { issues, includedWorkspaceDirs, selectedWorkspaces } = await main(options);

  assert(issues.files.has(join(cwd, 'docs/dangling.ts')));
  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);
  assert(!includedWorkspaceDirs.includes(join(cwd, 'packages/tools')));
  assert(!selectedWorkspaces?.includes('packages/tools'));
  assert(selectedWorkspaces?.includes('apps/frontend'));
  assert(selectedWorkspaces?.includes('apps/backend'));
});

test('Exclude workspaces by directory glob pattern', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['@fixtures/workspaces__*', '!./apps/*'],
  });
  const { issues, counters, includedWorkspaceDirs, selectedWorkspaces } = await main(options);

  assert(includedWorkspaceDirs.includes(join(cwd, 'apps/frontend')));
  assert(includedWorkspaceDirs.includes(join(cwd, 'apps/backend')));
  assert(!selectedWorkspaces?.includes('apps/frontend'));
  assert(!selectedWorkspaces?.includes('apps/backend'));

  assert(counters.types === 1);
  assert(counters.exports === 1);
  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);
  assert(issues.exports['packages/tools/utils.ts']['helperFn']);
});

test('Exclude workspace by directory path', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['@fixtures/workspaces__*', '!apps/frontend'],
  });
  const { issues, selectedWorkspaces } = await main(options);

  assert(!selectedWorkspaces?.includes('apps/frontend'));
  assert(!issues.unlisted['apps/frontend/index.ts']);
});

test('Only negation selector: exclude workspace from all', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['!apps/frontend'],
  });
  const { issues, selectedWorkspaces } = await main(options);

  assert(!selectedWorkspaces?.includes('apps/frontend'));
  assert(selectedWorkspaces?.includes('apps/backend'));
  assert(!issues.unlisted['apps/frontend/index.ts']);
  assert(issues.unlisted['apps/backend/index.ts']['globby']);
});

test('Multiple workspace selectors union', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['@fixtures/workspaces__shared', '@fixtures/workspaces__backend'],
  });
  const { issues, counters, selectedWorkspaces } = await main(options);

  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);
  assert(issues.unlisted['apps/backend/index.ts']['globby']);
  assert(selectedWorkspaces?.length === 2);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 1,
    dependencies: 2,
    unlisted: 2,
    processed: 4,
    total: 4,
  });
});

test('Mixed directory and package name selectors', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['./apps/frontend', '@fixtures/workspaces__shared'],
  });
  const { issues, counters } = await main(options);

  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);
  assert(issues.unlisted['apps/frontend/index.ts']['vanilla-js']);

  assert(counters.processed === 4);
});

test('Backward compatibility: single directory workspace', async () => {
  const options = await createOptions({ cwd, workspace: 'packages/shared' });
  const { issues, counters } = await main(options);

  assert(issues.types['packages/shared/types.ts']['UnusedEnum']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 1,
    processed: 4,
    total: 4,
  });
});

test('Strict mode: only analyze explicitly selected workspaces', async () => {
  const options = await createOptions({
    cwd,
    workspace: '@fixtures/workspaces__shared',
    isStrict: true,
  });
  const { counters } = await main(options);

  assert(counters.processed === 2);
});

test('Empty selection after exclusion', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['@fixtures/workspaces__shared', '!@fixtures/workspaces__shared'],
  });
  const { counters } = await main(options);

  assert(counters.total === 0);
});
