import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import type { Suppressions, SuppressionScope } from '../src/types/suppressions.ts';
import { generateSuppressions, mergeSuppressions, pruneSuppressions } from '../src/util/suppressions.ts';
import { initIssues } from '../src/util/issue-initializers.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/suppressions-workspaces');

const allInScope: SuppressionScope = () => true;

test('--suppress-all without workspace filter covers both workspaces', async () => {
  const options = await createOptions({ cwd, noSuppressions: true });
  const { issues } = await main(options);

  const suppressions = generateSuppressions(issues);

  assert(suppressions.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(suppressions.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
});

test('--suppress-all -W accumulates across workspaces', async () => {
  const optionsA = await createOptions({ noSuppressions: true, cwd, workspace: 'workspace-a' });
  const { issues: issuesA } = await main(optionsA);
  const first = generateSuppressions(issuesA);

  const optionsB = await createOptions({ noSuppressions: true, cwd, workspace: 'workspace-b' });
  const { issues: issuesB } = await main(optionsB);
  const second = generateSuppressions(issuesB);

  const merged = mergeSuppressions(first, second);

  assert(merged.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(merged.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
});

const createSuppressions = (): Suppressions => ({
  version: 1,
  suppressions: {
    'workspace-a/module.ts': {
      exports: { unusedA: {}, alreadyFixed: {} },
    },
    'workspace-b/module.ts': {
      exports: { unusedB: {}, alsoAlreadyFixed: {} },
    },
  },
});

test('Pruning after fix in one workspace preserves the other', async () => {
  const options = await createOptions({ cwd, noSuppressions: true });
  const { issues } = await main(options);

  const pruned = pruneSuppressions(issues, initIssues(), createSuppressions(), allInScope);

  assert(pruned.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(!pruned.suppressions['workspace-a/module.ts']?.exports?.['alreadyFixed']);
  assert(pruned.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
  assert(!pruned.suppressions['workspace-b/module.ts']?.exports?.['alsoAlreadyFixed']);
});

test('Pruning in a workspace-scoped run leaves other workspaces untouched', async () => {
  const options = await createOptions({ noSuppressions: true, cwd, workspace: 'workspace-a' });
  const { issues } = await main(options);

  const isInScope: SuppressionScope = filePath => filePath.startsWith('workspace-a/');
  const pruned = pruneSuppressions(issues, initIssues(), createSuppressions(), isInScope);

  assert(pruned.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(!pruned.suppressions['workspace-a/module.ts']?.exports?.['alreadyFixed']);
  assert(pruned.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
  assert(pruned.suppressions['workspace-b/module.ts']?.exports?.['alsoAlreadyFixed']);
});
