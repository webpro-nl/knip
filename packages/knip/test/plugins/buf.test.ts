import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find Buf generator dependencies and entries (v2)', async () => {
  const cwd = resolve('fixtures/plugins/buf/v2');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

test('Find Buf generator dependencies and entries (v1)', async () => {
  const cwd = resolve('fixtures/plugins/buf/v1');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

test('Find Buf generator dependencies and entries (templates)', async () => {
  const cwd = resolve('fixtures/plugins/buf/templates');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});
