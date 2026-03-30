import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/re-exports-recursive');

test('Should not stack overflow on recursive re-exports', async () => {
  const options = await createOptions({ cwd });
  await assert.doesNotReject(main(options));
});
