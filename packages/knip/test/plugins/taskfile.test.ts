import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/taskfile');

test('Find dependencies with the taskfile plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['Taskfile.yml']['esbuild-register']);
  assert(!issues.binaries['Taskfile.yml']['eslint']);
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
    binaries: 8,
    unresolved: 1,
    processed: 7,
    total: 7,
  });
});

test('Find dependencies in a Taskfile included by absolute path', async () => {
  const cwd = await copyFixture('fixtures/plugins/taskfile');
  const taskfilePath = join(cwd, 'Taskfile.yml');
  const taskfile = await readFile(taskfilePath, 'utf8');
  await writeFile(
    taskfilePath,
    taskfile.replace('nested: nested/Taskfile.yml', `nested: ${join(cwd, 'nested/Taskfile.yml')}`)
  );

  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['nested/Taskfile.yml']['some-nonexistent-binary']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 8,
    unresolved: 1,
    processed: 7,
    total: 7,
  });
});
