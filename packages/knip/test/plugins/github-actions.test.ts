import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/github-actions');

test('Find dependencies with the GitHub Actions plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['.github/workflows/test.yml']['esbuild-register']);

  // Let's start out conservatively
  // assert(issues.unresolved['.github/workflows/test.yml']['./script.js']);
  assert(issues.unresolved['.github/actions/composite/action.yml']['esbuild-register']);

  assert(issues.binaries['.github/actions/composite/action.yml']['eslint']);

  assert(issues.binaries['.github/workflows/test.yml']['changeset']);
  assert(issues.binaries['.github/workflows/test.yml']['eslint']);
  assert(issues.binaries['.github/workflows/test.yml']['knip']);
  assert(issues.binaries['.github/workflows/test.yml']['nyc']);
  assert(issues.binaries['.github/workflows/test.yml']['playwright']);
  assert(issues.binaries['.github/workflows/test.yml']['release-it']);
  assert(issues.binaries['.github/workflows/test.yml']['wait-on']);

  // A composite action's own script, referenced via `$GITHUB_ACTION_PATH`, is
  // resolved relative to the action directory (not reported as unused).
  assert(!('.github/actions/composite/helper.mjs' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 8,
    unresolved: 2,
    processed: 11,
    total: 11,
  });
});
