import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/peer-dependencies-optional-ignored');

test('Find no issues/hints if optional peerDependencies are also ignored (dev)Dependencies', async () => {
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.equal(configurationHints.size, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
