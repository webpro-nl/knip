import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

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
