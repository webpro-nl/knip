import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vitest14');

test('Find dependencies with the Vitest plugin when build.lib.entry is resolved against the Vite root, not the Vitest root', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.files['src/library.ts']);
  assert(!issues.files['src/absolute.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
