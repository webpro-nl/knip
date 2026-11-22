import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Resolve Oxlint runtime function', async () => {
  const options = await createOptions({
    cwd: resolve('fixtures/plugins/oxlint-runtime-function'),
  });
  const { issues } = await main(options);

  assert.deepEqual(Object.values(issues.devDependencies).flatMap(Object.keys), []);
  assert.deepEqual(Object.values(issues.unlisted).flatMap(Object.keys), ['eslint-plugin-runtime-ssr']);
});
