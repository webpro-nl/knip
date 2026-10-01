import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/namespace-array');

test('Treat namespace imports in array literals as opaque references', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert.deepEqual(issues.exports, {});
});
