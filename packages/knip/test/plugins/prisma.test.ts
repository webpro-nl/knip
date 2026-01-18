import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/prisma');

test('Find dependencies with the Prisma plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['lint-staged']);
  assert(issues.binaries['package.json']['lint-staged']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    binaries: 1,
    processed: 13,
    total: 13,
  });
});
