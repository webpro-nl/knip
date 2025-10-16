import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-issues');

test('Ignore specific issue types for specific file patterns', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // Generated files should NOT report unused exports
  assert(!issues.exports['src/generated/types.ts']?.['unusedGenerated']);
  assert(!issues.exports['src/model.generated.ts']?.['unusedExport']);
  assert(!issues.exports['src/model.generated.ts']?.['GeneratedModel']);

  // Generated files should NOT report unused types
  assert(!issues.types['src/generated/types.ts']?.['UnusedType']);

  // But unlisted dependencies SHOULD still be reported in generated files
  assert(issues.unlisted['src/generated/types.ts']?.['nonexistent-package']);

  // Regular files SHOULD report unused exports
  assert(issues.exports['src/regular.ts']?.['unusedRegular']);
  assert(issues.exports['src/regular.ts']?.['RegularClass']);

  // Index file reports its unused export
  assert(issues.exports['src/index.ts']?.['used']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    unlisted: 1,
    processed: 4,
    total: 4,
  });
});
