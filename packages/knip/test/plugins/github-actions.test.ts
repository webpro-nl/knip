import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/github-actions');

test('Find dependencies with the GitHub Actions plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['.github/workflows/test.yml']['esbuild-register']);

  // Let's start out conservatively
  // assert(issues.unresolved['.github/workflows/test.yml']['./script.js']);
  assert(issues.unresolved['.github/actions/composite/action.yml']['esbuild-register']);

  assert(issues.binaries['.github/actions/composite/action.yml']['eslint']);
  assert(issues.binaries['.github/actions/composite/action.yml']['playwright']);

  assert(issues.binaries['.github/workflows/test.yml']['changeset']);
  assert(issues.binaries['.github/workflows/test.yml']['eslint']);
  assert(issues.binaries['.github/workflows/test.yml']['knip']);
  assert(issues.binaries['.github/workflows/test.yml']['nyc']);
  assert(issues.binaries['.github/workflows/test.yml']['playwright']);
  assert(issues.binaries['.github/workflows/test.yml']['prisma']);
  assert(issues.binaries['.github/workflows/test.yml']['release-it']);
  assert(issues.binaries['.github/workflows/test.yml']['wait-on']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 10,
    unresolved: 2,
    processed: 10,
    total: 10,
  });
});
