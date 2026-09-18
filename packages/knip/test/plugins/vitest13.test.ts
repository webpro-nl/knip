import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vitest13');

test('Find dependencies with the Vitest plugin when a standalone config is loaded from a subdirectory via -c/--config, without an explicit test.root', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.files['setup.ts']);
  assert(!issues.files['tests/index.test.ts']);
  assert(!issues.unresolved['config/vitest.config.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});
