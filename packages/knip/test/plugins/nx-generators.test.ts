import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nx-generators');

test('Find local Nx generator factories and executor implementations', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files['tools/my-plugin/src/foo/factory.ts']);

  for (const file of [
    'tools/my-plugin/src/foo/generator.ts',
    'tools/my-plugin/src/foo/implementation.ts',
    'tools/my-plugin/src/bar/executor.ts',
    'tools/my-plugin/src/bar/batch-executor.ts',
    'tools/alias-plugin/src/baz/schematic.ts',
    'tools/alias-plugin/src/qux/builder.ts',
    'tools/my-plugin/scripts/bundle.mjs',
  ]) {
    assert(!issues.files[file], file);
  }

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 1,
    processed: 8,
    total: 8,
  });
});
