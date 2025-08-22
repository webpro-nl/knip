import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vitest');

test('Find dependencies with the Vitest plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['vite.config.ts']['@vitest/coverage-c8']);
  assert(issues.unlisted['vite.config.ts']['@edge-runtime/vm']);
  assert(issues.unlisted['vitest.workspace.ts']['@edge-runtime/vm']);
  assert(issues.unlisted['vitest-default-coverage.config.ts']['jsdom']);
  assert(issues.unlisted['vitest-default-coverage.config.ts']['@vitest/coverage-v8']);
  assert(issues.unlisted['vitest.config.ts']['happy-dom']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-istanbul']);
  assert(issues.unresolved['vitest.config.ts']['setup.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 7,
    unresolved: 1,
    processed: 9,
    total: 9,
  });
});

test('Find dependencies with the Vitest plugin (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert.deepEqual(issues.files, new Set([join(cwd, 'src/setupTests.ts')]));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 1,
    total: 1,
  });
});
