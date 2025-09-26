import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/script-visitors-bun');

test('Find dependencies with custom script visitors (bun)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['script.ts']['oh-my']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
    binaries: 1,
  });
});
