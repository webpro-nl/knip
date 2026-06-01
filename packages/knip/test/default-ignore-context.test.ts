import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

test('Ignore Conductor .context artifacts by default', async () => {
  const cwd = resolve('fixtures/default-ignore-context');
  const options = await createOptions({ cwd });
  const { configurationHints, counters, issues } = await main(options);

  assert.deepEqual(configurationHints, []);
  assert.deepEqual(issues.files, {});

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 2,
  });
});
