import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/github-actions-workspaces');

test('Find dependencies with the GitHub Actions plugin (w/ workspaces)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.unresolved['.github/workflows/dir.yml']['./missing-hook.js'].workspace, 'packages/app');

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
  });
});

test('Find dependencies with the GitHub Actions plugin (w/ workspaces, production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['hello']);
  assert(issues.dependencies['packages/app/package.json']['@opentelemetry/auto-instrumentations-node']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
  });
});
