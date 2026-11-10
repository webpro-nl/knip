import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vitest');

test('Find dependencies with the Vitest plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['vite.config.ts']['@vitest/coverage-c8']);
  assert(issues.unlisted['vite.config.ts']['@edge-runtime/vm']);
  assert(issues.unlisted['vitest.workspace.ts']['@edge-runtime/vm']);
  assert(issues.unlisted['vitest-default-coverage.config.ts']['jsdom']);
  assert(issues.unlisted['vitest-default-coverage.config.ts']['@vitest/coverage-v8']);
  assert(issues.unlisted['vitest.config.ts']['happy-dom']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-istanbul']);
  assert(issues.unlisted['package.json']['@vitest/coverage-istanbul']);
  assert(issues.unlisted['package.json']['vitest-sonar-reporter']);
  assert(issues.unlisted['package.json']['jsdom']);
  assert(issues.unlisted['package.json']['vue-tsc']);
  assert(issues.unresolved['vitest.config.ts']['setup.js']);
  assert(issues.unresolved['vitest.config.ts']['snapshot-serializer.js']);
  assert(issues.unlisted['vitest.config.ts']['installed-pkg']);
  assert(!issues.files['test/basic.edge.ts']);
  assert(!issues.files['coverage/config-provider.ts']);
  assert(!issues.files['coverage/cli-provider.ts']);
  assert(!issues.unlisted['vitest-custom-coverage.config.ts']);
  assert(!issues.unlisted['package.json']['@vitest/coverage-custom']);
  assert(!issues.unresolved['package.json']?.['./cli-provider.ts']);
  assert(!issues.files['src/setupBare.ts']);
  assert(issues.files['shared-state.ts']);
  assert(issues.files['installed-pkg.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    unlisted: 12,
    unresolved: 2,
    processed: 21,
    total: 21,
  });
});

test('Find dependencies with the Vitest plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert('shared-state.ts' in issues.files);
  assert('installed-pkg.ts' in issues.files);
  assert(issues.dependencies['package.json']['linked-package']);
  assert(issues.dependencies['package.json']['shared-state']);
  assert(issues.dependencies['package.json']['upstream-esm']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    dependencies: 3,
    processed: 2,
    total: 2,
  });
});

test('Find dependencies with the Vitest plugin (strict)', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['shared-state']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    dependencies: 3,
    processed: 2,
    total: 2,
  });
});

test('Find dependencies with the Vitest plugin (files only)', async () => {
  const options = await createOptions({ cwd, includedIssueTypes: ['files'] });
  const { issues, counters } = await main(options);

  assert(!issues.files['src/setupBare.ts']);
  assert(issues.files['shared-state.ts']);
  assert(issues.files['installed-pkg.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 21,
    total: 21,
  });
});
