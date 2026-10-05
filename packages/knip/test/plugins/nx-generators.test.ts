import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nx-generators');

test('Find local Nx generator factories and executor implementations', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.files['tools/my-plugin/src/foo/generator.ts']);
  assert(!issues.files['tools/my-plugin/src/bar/executor.ts']);
});
