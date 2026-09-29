import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/rstest-config');

test('Find entries in a function-form rstest config', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert('src/skipped.check.ts' in issues.files);
  assert('src/ignored.check.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 6,
    total: 6,
  });
});
