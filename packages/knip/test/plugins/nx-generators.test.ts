import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nx-generators');

test('Find local Nx generator factories and executor implementations', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  for (const file of [
    'tools/my-plugin/src/foo/generator.ts',
    'tools/my-plugin/src/foo/implementation.ts',
    'tools/my-plugin/src/bar/executor.ts',
    'tools/my-plugin/src/bar/batch-executor.ts',
    'tools/alias-plugin/src/baz/schematic.ts',
    'tools/alias-plugin/src/qux/builder.ts',
  ]) {
    assert(!issues.files[file], file);
  }
});
