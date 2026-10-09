import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Resolve Serverless handlers with empty object-form plugin modules', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/serverless-framework-empty-plugin-modules') });
  const { counters, issues } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
  assert.deepEqual(issues.files, {});
  assert.deepEqual(issues.devDependencies, {});
});
