import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Resolve Serverless handlers with empty object-form plugin modules', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/serverless-framework-empty-plugin-modules') });
  const { issues } = await main(options);

  assert.deepEqual(issues.files, {});
});
