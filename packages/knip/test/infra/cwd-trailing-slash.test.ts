import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

// A trailing slash in `cwd`/`--directory` was kept by `normalize`, while workspace dirs
// drop it, so `cwd !== dir` for the root workspace and every `isRootOnly` plugin (here
// GitHub Actions) was skipped. Results must not depend on the trailing slash. See #2135.
const cwd = resolve('fixtures/plugins/github-actions');

const run = async (dir: string) => {
  const { issues, counters } = await main(await createOptions({ cwd: dir }));
  return JSON.parse(JSON.stringify({ issues, counters }).replaceAll(cwd, '<cwd>'));
};

test('Trailing slash in cwd does not disable root-only plugins (#2135)', async () => {
  const expected = await run(cwd);
  const actual = await run(`${cwd}/`);
  assert.deepEqual(actual, expected);
});
