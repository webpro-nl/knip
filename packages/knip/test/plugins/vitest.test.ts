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
  assert(!issues.files['test/basic.edge.ts']);
  assert(!issues.files['coverage/config-provider.ts']);
  assert(!issues.files['coverage/cli-provider.ts']);
  assert(!issues.unlisted['vitest-custom-coverage.config.ts']);
  assert(!issues.unlisted['package.json']['@vitest/coverage-custom']);
  assert(!issues.unresolved['package.json']?.['./cli-provider.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 11,
    unresolved: 2,
    processed: 16,
    total: 16,
  });
});

test('Find dependencies with the Vitest plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert('src/setupTests.ts' in issues.files);
  assert('src/htmlSnapshotSerializer.ts' in issues.files);
  assert('coverage/config-provider.ts' in issues.files);
  assert('coverage/cli-provider.ts' in issues.files);
  assert.equal(Object.keys(issues.files).length, 4);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 4,
    total: 4,
  });
});
