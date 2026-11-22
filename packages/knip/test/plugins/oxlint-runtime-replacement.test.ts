import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Use evaluated lint spreads and imported overrides', async () => {
  const options = await createOptions({
    cwd: resolve('fixtures/plugins/oxlint-runtime-replacement'),
  });
  const { issues } = await main(options);

  assert.deepEqual(Object.keys(issues.devDependencies['package.json']), ['eslint-plugin-regexp']);
  assert.deepEqual(issues.unlisted, {});
});
