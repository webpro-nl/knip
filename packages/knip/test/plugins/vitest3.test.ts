import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vitest3');

test('Find dependencies with the Vitest plugin (3)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@swc/plugin-styled-components']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-v8']);
  assert(issues.unlisted['vitest.config.ts']['jsdom']);
  assert(issues.unresolved['vitest.config.ts']['./src/setupTests.tsx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 2,
    unresolved: 1,
    processed: 5,
    total: 5,
  });
});
