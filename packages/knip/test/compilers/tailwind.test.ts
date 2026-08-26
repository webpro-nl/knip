import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/tailwind');

test('Built-in compiler for Tailwind CSS', async () => {
  const options = await createOptions({ cwd, includedIssueTypes: ['unresolved', 'cycles'] });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.cycles).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 6,
    total: 6,
  });
});
