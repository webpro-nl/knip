import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/package-entry-bare');

test('No package-entry hint for bare specifier in main when first segment is a listed dependency', async () => {
  const options = await createOptions({ cwd });
  const { configurationHints } = await main(options);

  assert.deepEqual(configurationHints, []);
});
