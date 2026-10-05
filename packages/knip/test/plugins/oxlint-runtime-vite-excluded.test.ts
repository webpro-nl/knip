import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Resolve Oxlint runtime vite-excluded', async () => {
  const options = await createOptions({
    cwd: resolve('fixtures/plugins/oxlint-runtime-vite-excluded'),
  });
  const { issues } = await main(options);

  assert.deepEqual(Object.keys(issues.devDependencies['package.json']).sort(), [
    'eslint-plugin-react-hooks',
    'eslint-plugin-regexp',
  ]);
  assert.deepEqual(issues.unlisted, {});
});
