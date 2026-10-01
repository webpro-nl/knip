import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/next-turbopack-loaders');

test('Find dependencies and local loaders in Next.js Turbopack rules', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.devDependencies['package.json']), ['unused-loader']);
  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 3,
    total: 3,
  });
});
