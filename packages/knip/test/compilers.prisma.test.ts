import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/compilers-prisma');

test('Built-in compiler for Prisma schema', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['prisma-openapi']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 1,
    total: 1,
  });
});
