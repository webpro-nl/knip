import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vitest-npm-script');

test('Find dependencies with the Vitest plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['vitest']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-v8']);
  assert(issues.binaries['package.json']['vitest']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 1,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});
