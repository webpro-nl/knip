import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/child-process-script-cwd');

test('Resolve an expanded package script against the directory of its manifest', async () => {
  const { issues, counters } = await main(await createOptions({ cwd }));

  assert.deepEqual(issues.unresolved, {});
  assert.deepEqual(counters, { ...baseCounters, processed: 4, total: 4 });
});
