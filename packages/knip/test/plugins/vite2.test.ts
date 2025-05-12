import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/vite2');
const cwd2 = resolve('fixtures/plugins/vite3');
test('Find extension issues with incomplete config', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.files.has(join(cwd, 'src/mock.ts')));
  assert(issues.files.has(join(cwd, 'src/mock.desktop.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    devDependencies: 0,
    unlisted: 0,
    processed: 6,
    total: 6,
  });
});

test('Should find 0 issues with proper extensions config', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd: cwd2,
  });

  assert.strictEqual(issues.files.size, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 0,
    devDependencies: 2,
    unlisted: 0,
    processed: 5,
    total: 5,
  });
});
