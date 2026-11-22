import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/rstest-config');

test('Find literal entries in a function-form rstest config', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'src/f/render.check.ts',
    'src/ignored.check.ts',
    'src/skipped.check.ts',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 8,
    total: 8,
  });
});
