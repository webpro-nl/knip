import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vitest12');

test('Find dependencies with the Vitest plugin when project config is nested in a subdirectory of the workspace', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.files['test/unit/setup.ts']);
  assert(!issues.files['test/unit/global-setup.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});
