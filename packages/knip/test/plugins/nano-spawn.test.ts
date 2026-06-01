import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nano-spawn');

test('Find binaries with the nano-spawn plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert(!issues.binaries['main.js']?.phantomnano);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
