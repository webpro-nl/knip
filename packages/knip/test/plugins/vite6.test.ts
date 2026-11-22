import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vite6');

test('Do not add Vitest test entries for a Vite config without Vitest', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/apple.test.ts' in issues.files);
  assert('src/apple.ts' in issues.files);
  assert('src/banana.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 4,
    total: 4,
  });
});
