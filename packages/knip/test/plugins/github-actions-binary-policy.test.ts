import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/github-actions-binary-policy');

test('GitHub Actions credits installed ambient binaries and preserves explicit project references', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(Object.keys(issues.devDependencies['package.json'] ?? {}), ['unused-provider']);
  assert.deepEqual(Object.keys(issues.binaries['.github/workflows/build.yml'] ?? {}), ['missing-project-cli']);
  assert(issues.unresolved['.github/workflows/build.yml']['missing-import-hook']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    binaries: 1,
    unresolved: 1,
    processed: 1,
    total: 1,
  });
});
