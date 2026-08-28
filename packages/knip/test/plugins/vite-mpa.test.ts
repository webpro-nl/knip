import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite-mpa');

test('Find module entries from nested Vite multi-page index.html files', async () => {
  const { issues } = await main(await createOptions({ cwd }));

  assert.equal(issues.files['nested/nested-entry.ts'], undefined);
});
