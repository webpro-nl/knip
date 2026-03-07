import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/peer-dependencies-optional');

test('Find referenced optional peerDependencies', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.optionalPeerDependencies['package.json']['pg']);
  assert(issues.optionalPeerDependencies['package.json']['@types/pg']);

  assert.deepEqual(counters, {
    ...baseCounters,
    optionalPeerDependencies: 2,
    processed: 1,
    total: 1,
  });
});
