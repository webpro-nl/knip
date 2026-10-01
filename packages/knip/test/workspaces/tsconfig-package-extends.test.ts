import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces/tsconfig-package-extends');

test('Include transitive workspace dependencies of the selected workspace', async () => {
  const options = await createOptions({
    cwd,
    workspace: '@fixtures/workspaces-tsconfig-package-extends__client',
  });
  const { issues, counters, includedWorkspaceDirs } = await main(options);

  assert(!issues.devDependencies['apps/client/package.json']?.['@types/chrome']);
  assert(includedWorkspaceDirs.includes(join(cwd, 'packages/tsconfig')));
  assert(includedWorkspaceDirs.includes(join(cwd, 'packages/tsconfig-base')));
  assert(!includedWorkspaceDirs.includes(join(cwd, 'packages/ignored')));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
