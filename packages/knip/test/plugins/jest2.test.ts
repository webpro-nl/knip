import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/jest2');

test('Find dependencies with the Jest plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['jest']);

  // Correctly identifies setup file in a non-root jest.config.js which uses
  // <rootDir> to reference the root directory.
  assert(!issues.files.has(join(cwd, 'project1/setupFiles/setup.js')));

  // Correctly identifies a local `testEnvironment` file.
  assert(!issues.files.has(join(cwd, 'jest.environment.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 0,
    devDependencies: 1,
    unlisted: 0,
    unresolved: 0,
    processed: 5,
    total: 5,
  });
});
