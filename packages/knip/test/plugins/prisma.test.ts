import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/prisma');

test('Find dependencies and literal --schema paths with the Prisma plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['lint-staged']);
  assert(issues.binaries['package.json']['lint-staged']);
  assert.deepEqual(Object.keys(issues.files), ['prisma/s/schema-script.prisma']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    binaries: 1,
    files: 1,
    processed: 14,
    total: 14,
  });
});
