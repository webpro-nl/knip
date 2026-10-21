import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigurationChief } from '../../src/ConfigurationChief.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Workspace lookup selects the deepest directory with an exact slash boundary', async () => {
  const cwd = resolve('fixtures/workspaces/nested');
  const chief = new ConfigurationChief(await createOptions({ cwd }));
  await chief.getWorkspaces();
  const parent = join(cwd, 'L-1-1/L-1-2');
  const deepest = join(parent, 'L-1-3');
  const cases: [string, string | undefined][] = [
    [`${deepest}/source.ts`, deepest],
    [`${deepest}/`, deepest],
    [deepest, parent],
    [`${deepest}-other/source.ts`, parent],
    [`${cwd}/source.ts`, cwd],
    [`${cwd}/`, cwd],
    [cwd, undefined],
    [`${cwd}-other/source.ts`, undefined],
    ['/', undefined],
    ['', undefined],
  ];
  for (let repeat = 0; repeat < 2; repeat++) {
    for (const [filePath, expectedDir] of cases) {
      assert.equal(chief.findWorkspaceByFilePath(filePath)?.dir, expectedDir, filePath);
    }
  }
});

test('An available but excluded workspace does not fall back to an included ancestor', async () => {
  const cwd = resolve('fixtures/workspaces/basic');
  const chief = new ConfigurationChief(await createOptions({ cwd, workspace: 'packages/shared' }));
  await chief.getWorkspaces();
  const excluded = chief.availableWorkspaceDirs.find(dir => !chief.workspacesByDir.has(dir));
  assert(excluded);
  assert(chief.workspacesByDir.has(cwd));
  assert.equal(chief.findWorkspaceByFilePath(`${excluded}/source.ts`), undefined);
  assert.equal(chief.findWorkspaceByFilePath(`${cwd}/apps/ignored-workspace/source.ts`)?.dir, cwd);
});
