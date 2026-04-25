import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces-utf8-bom');

test('Discover workspace whose package.json starts with a UTF-8 BOM', async () => {
  const options = await createOptions({ cwd });
  await assert.doesNotReject(main(options));
  const { counters } = await main(options);
  assert.equal(counters.processed, 2);
});
