import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/tsconfig-types-as-type-only');

test('Treat tsconfig.json compilerOptions.types entries as type-only', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.unresolved['tsconfig.json']?.mango);
  assert(!issues.unlisted['tsconfig.json']?.mango);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
