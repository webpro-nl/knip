import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/type-visibility');

test('Report types only visible through function signatures, keep types visible through type exports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // Type → function: reported (nobody imports the type)
  assert(issues.types['src/lib.ts']['ParamConfig']);
  assert(issues.types['src/lib.ts']['ResponseData']);
  assert(issues.types['src/lib.ts']['InternalState']);
  assert(issues.types['src/lib.ts']['LogLevel']);
  assert(issues.exports['src/lib.ts']['Connection']);
  assert(issues.exports['src/lib.ts']['defaultHandler']);

  // Type → type (imported): kept
  assert(!issues.types['src/lib.ts']?.['SuccessResult']);
  assert(!issues.types['src/lib.ts']?.['ErrorResult']);
  assert(!issues.types['src/lib.ts']?.['BaseEntity']);
  assert(!issues.types['src/lib.ts']?.['Metadata']);
  assert(!issues.types['src/lib.ts']?.['DirectlyUsed']);

  // Type → type → function chain: reported (chain ends at function)
  assert(issues.types['src/lib.ts']['FilterRule']);
  assert(issues.types['src/lib.ts']['FilterSet']);

  // Unused
  assert(issues.types['src/lib.ts']['CompletelyUnused']);
  assert(issues.types['src/lib.ts']['SharedConfig']);
  assert(issues.types['src/lib.ts']['AppConfig']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 2,
    types: 9,
    processed: 2,
    total: 2,
  });
});
