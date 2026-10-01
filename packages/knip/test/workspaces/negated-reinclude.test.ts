import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces/negated-reinclude');

test('Discover a workspace re-included after a negated pattern', async () => {
  const options = await createOptions({ cwd });
  const { includedWorkspaceDirs } = await main(options);

  assert(includedWorkspaceDirs.includes(join(cwd, 'packages/should-include')));
});
