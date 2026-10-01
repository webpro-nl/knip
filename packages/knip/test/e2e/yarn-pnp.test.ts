import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { join } from '../../src/util/path.ts';
import { resolve } from '../helpers/resolve.ts';
import type { Results } from '../../src/run.ts';

const cliPath = resolve('src/cli.ts');
const reporterPath = resolve('test/e2e/yarn-pnp-reporter.mjs');
const pnpCjsPath = join(resolve('fixtures/yarn-pnp'), '.pnp.cjs');

test('Resolve package manifests and attribute npm aliases under Yarn PnP', () => {
  const cwd = resolve('fixtures/yarn-pnp');
  const { stdout, stderr, status } = spawnSync('node', ['--require', pnpCjsPath, cliPath, '--reporter', reporterPath], {
    cwd,
    env: { PATH: process.env.PATH },
    encoding: 'utf8',
  });

  assert.equal(status, 1, stderr);
  const result: Results = JSON.parse(stdout);
  assert.deepEqual(Object.keys(result.issues.dependencies), ['package.json']);
  assert.deepEqual(Object.keys(result.issues.dependencies['package.json']), ['isarray']);
  assert.deepEqual(result.counters, {
    dependencies: 1,
    processed: 3,
    total: 4,
  });
});
