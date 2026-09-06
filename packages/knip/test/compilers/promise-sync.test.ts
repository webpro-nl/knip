import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { ConfigurationError } from '../../src/util/errors.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/promise-sync');

test('Throw when a sync compiler returns a promise', async () => {
  await assert.rejects(
    async () => {
      const options = await createOptions({ cwd });
      await main(options);
    },
    error =>
      error instanceof ConfigurationError &&
      error.message.includes('Compiler for .foo did not return a string') &&
      error.message.includes('asyncCompilers')
  );
});
