import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/node-fs-promises-glob');

test('Resolve node:fs/promises glob patterns as entry files', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!('migrations/one.ts' in issues.files));
});
