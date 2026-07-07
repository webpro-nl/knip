import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/serverless-framework');
const typescriptPluginsCwd = resolve('fixtures/plugins/serverless-framework-typescript-plugins');
const typescriptImportedFunctionsCwd = resolve('fixtures/plugins/serverless-framework-typescript-imported-functions');

test('Find dependencies with the Serverless Framework plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Find dependencies from Serverless Framework TypeScript plugins', async () => {
  const options = await createOptions({ cwd: typescriptPluginsCwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
  assert.deepEqual(issues.devDependencies, {});
});

test('Find imported TypeScript function handlers from Serverless Framework config', async () => {
  const options = await createOptions({ cwd: typescriptImportedFunctionsCwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 9,
    total: 9,
  });
});
