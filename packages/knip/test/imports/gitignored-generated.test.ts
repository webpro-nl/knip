import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/gitignored-generated');

test('Skip unresolved imports of gitignored generated files across extension aliases', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['index.ts']['./missing.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 1,
    total: 1,
  });
});
