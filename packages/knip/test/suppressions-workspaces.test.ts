import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import type { Suppressions } from '../src/types/suppressions.js';
import { generateSuppressions, mergeSuppressions, pruneSuppressions } from '../src/util/suppressions.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/suppressions-workspaces');

test('--suppress-all without workspace filter covers both workspaces', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const suppressions = generateSuppressions(issues);

  assert(suppressions.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(suppressions.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
});

test('--suppress-all -W accumulates across workspaces', async () => {
  const optionsA = await createOptions({ cwd, workspace: 'workspace-a' });
  const { issues: issuesA } = await main(optionsA);
  const first = generateSuppressions(issuesA);

  const optionsB = await createOptions({ cwd, workspace: 'workspace-b' });
  const { issues: issuesB } = await main(optionsB);
  const second = generateSuppressions(issuesB);

  const merged = mergeSuppressions(first, second);

  assert(merged.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(merged.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
});

test('Pruning after fix in one workspace preserves the other', async () => {
  const suppressions: Suppressions = {
    version: 1,
    suppressions: {
      'workspace-a/module.ts': {
        exports: { unusedA: {}, alreadyFixed: {} },
      },
      'workspace-b/module.ts': {
        exports: { unusedB: {} },
      },
    },
  };

  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  const pruned = pruneSuppressions(issues, suppressions);

  assert(pruned.suppressions['workspace-a/module.ts']?.exports?.['unusedA']);
  assert(!pruned.suppressions['workspace-a/module.ts']?.exports?.['alreadyFixed']);
  assert(pruned.suppressions['workspace-b/module.ts']?.exports?.['unusedB']);
});
