import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/karma2');

test('Find dependencies with the Karma plugin (test files)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.ok(issues.files.has(join(cwd, 'out-of-base-path', 'example.spec.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 1,
    processed: 4,
    total: 4,
  });
});
