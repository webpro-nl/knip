import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/imports-namespace');

test('Ignore namespace re-export by entry file', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['namespace3.ts']['NS3.identifier32']);
  assert(issues.exports['namespace5.ts']['NS5.identifier36']);
  assert(issues.exports['namespace6.ts']['NS6.identifier38']);
  assert(issues.exports['namespace9.ts']['NS9.identifier44']);
  assert(!issues.exports['namespace10.ts'], 'NS10');

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    exports: 4,
    processed: 15,
    total: 15,
  });
});
