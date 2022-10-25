import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';

test('Support JSX/TSX files', async () => {
  const workingDir = 'test/fixtures/react';

  const { counters } = await main({
    ...baseArguments,
    cwd: workingDir,
    workingDir,
  });

  assert.deepEqual(counters, {
    dependencies: 0,
    devDependencies: 0,
    duplicates: 0,
    exports: 0,
    files: 0,
    nsExports: 0,
    nsTypes: 0,
    processed: 2,
    total: 2,
    types: 0,
    unlisted: 0,
  });
});
