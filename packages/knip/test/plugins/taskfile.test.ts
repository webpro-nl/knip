import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/taskfile');

test('Find dependencies with the taskfile plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['Taskfile.yml']['esbuild-register']);
  assert(issues.binaries['Taskfile.yml']['eslint']);
  assert(issues.binaries['Taskfile.yml']['knip']);
  assert(issues.binaries['Taskfile.yml']['prettier']);
  assert(issues.binaries['Taskfile.yml']['test-command-object-binary']);
  assert(issues.binaries['Taskfile.yml']['deferred-binary']);
  assert(issues.binaries['Taskfile.yml']['for-loop-binary']);
  assert(issues.binaries['nested/Taskfile.yml']['some-nonexistent-binary']);
  assert(issues.binaries['shared/Taskfile.yml']['another-nonexistent-binary']);
  assert(issues.binaries['shared/deep/Taskfile.yml']['yet-another-nonexistent-binary']);

  assert.deepEqual(counters, {
    ...baseCounters,
    // case-sensitivity: fast-glob returns two files (taskfile.yml and Taskfile.yml) while there's only one
    binaries: process.platform === 'darwin' || process.platform === 'win32' ? 15 : 9,
    unresolved: process.platform === 'darwin' || process.platform === 'win32' ? 2 : 1,
    processed: 7,
    total: 7,
  });
});
