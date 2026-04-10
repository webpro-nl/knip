import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/foreign-file-extensions');
const cwdDefault = resolve('fixtures/foreign-file-extensions-default');

test('Respect custom foreignFileExtensions configuration', async () => {
  // Test fixture has custom foreignFileExtensions: ['.xyz', '.custom', '.css']
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // Files with extensions NOT in custom foreignFileExtensions should appear as unresolved (when they don't exist)
  assert(issues.unresolved['index.ts']['./unknown.unknown']);
  assert(issues.unresolved['index.ts']['./missing-file']);

  // These should NOT be in unresolved (they're in custom foreignFileExtensions)
  assert(!issues.unresolved?.['index.ts']?.['./style.css']);
  assert(!issues.unresolved?.['index.ts']?.['./icon.xyz']);
  assert(!issues.unresolved?.['index.ts']?.['./data.custom']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 2,
    processed: 2,  // knip.ts and index.ts
    total: 2,      // Only TypeScript files are included in project files
  });
});

test('Use default foreignFileExtensions when not configured', async () => {
  // Test fixture has no knip configuration, so uses default foreignFileExtensions
  const options = await createOptions({ cwd: cwdDefault });
  const { issues, counters } = await main(options);

  // Files with extensions NOT in default foreignFileExtensions should appear as unresolved (when they don't exist)
  assert(issues.unresolved['index.ts']['./custom.xyz']);
  assert(issues.unresolved['index.ts']['./missing-file']);

  // These should NOT be in unresolved (they're in default foreignFileExtensions)
  assert(!issues.unresolved?.['index.ts']?.['./style.css']);
  assert(!issues.unresolved?.['index.ts']?.['./image.png']);
  assert(!issues.unresolved?.['index.ts']?.['./data.yaml']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 2,
    processed: 1,  // Only index.ts (no knip.ts in default fixture)
    total: 1,
  });
});