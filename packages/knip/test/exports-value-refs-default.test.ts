import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/exports-value-refs-default');

test('Find unused exports in exported types (default)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['refs.ts']['logger']);
  assert(issues.exports['refs.ts']['UnusedClass']);
  assert(issues.types['refs.ts']['UnusedTypeInUnusedExport']);
  assert(issues.types['refs.ts']['UnusedInterface']);
  assert(issues.types['refs.ts']['UnusedTypeWithClass']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    types: 3,
    processed: 2,
    total: 2,
  });
});
