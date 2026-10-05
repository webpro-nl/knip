import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Resolve Oxlint runtime settings', async () => {
  const options = await createOptions({
    cwd: resolve('fixtures/plugins/oxlint-runtime-settings'),
  });
  const { issues } = await main(options);

  assert.deepEqual(Object.values(issues.devDependencies).flatMap(Object.keys), []);
  assert.deepEqual(issues.unlisted, {});
});
