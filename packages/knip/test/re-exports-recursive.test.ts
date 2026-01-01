import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/re-exports-recursive');

test('Should not stack overflow on recursive re-exports', async () => {
  const options = await createOptions({ cwd });
  await assert.doesNotReject(main(options));
});
