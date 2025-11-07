import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/ava');

test('Find dependencies with the Ava plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['package.json']['ts-node/esm/transpile-only']);
  assert(issues.unresolved['ava.config.mjs']['tsconfig-paths/register']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 2,
    processed: 1,
    total: 1,
  });
});
