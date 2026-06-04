import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/types/type-visibility');

test('Keep types referenced in exported value signatures alive (declaration emit / TS4023)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // Type → exported value signature: required for .d.ts emit
  assert(!issues.types['src/lib.ts']?.['ParamConfig']);
  assert(!issues.types['src/lib.ts']?.['ResponseData']);
  assert(!issues.types['src/lib.ts']?.['LogLevel']);
  assert(!issues.exports['src/lib.ts']?.['Connection']);
  assert(!issues.exports['src/lib.ts']?.['defaultHandler']);

  // Used only in function body (not signature): still flagged
  assert(issues.types['src/lib.ts']['InternalState']);

  // Type → type (structurally inlined): flagged
  assert(issues.types['src/lib.ts']['SuccessResult']);
  assert(issues.types['src/lib.ts']['ErrorResult']);
  assert(issues.types['src/lib.ts']['BaseEntity']);
  assert(issues.types['src/lib.ts']['Metadata']);

  // Directly imported: kept
  assert(!issues.types['src/lib.ts']?.['DirectlyUsed']);

  // Chain: FilterRule → FilterSet (type) → applyFilters (function).
  // FilterSet is in a value signature → kept; FilterRule structurally inlined into FilterSet → flagged.
  assert(!issues.types['src/lib.ts']?.['FilterSet']);
  assert(issues.types['src/lib.ts']['FilterRule']);

  // SharedConfig used in both function param and unused type alias → kept (via function path)
  assert(!issues.types['src/lib.ts']?.['SharedConfig']);
  assert(issues.types['src/lib.ts']['AppConfig']);

  // Genuinely unused
  assert(issues.types['src/lib.ts']['CompletelyUnused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    types: 8,
    processed: 2,
    total: 2,
  });
});
