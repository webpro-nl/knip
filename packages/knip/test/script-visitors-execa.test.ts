import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/script-visitors-execa');

test('Find dependencies with custom script visitors (execa)', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert(!issues.binaries['methods.mjs']?.phantomexeca);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 6,
    total: 6,
  });
});
