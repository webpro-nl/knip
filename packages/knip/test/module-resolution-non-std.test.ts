import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/module-resolution-non-std');

test('Resolve non-standard extensions and report unresolved imports', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['src/index.ts']['@org/unresolved']);
  assert(issues.unlisted['src/index.ts']['unresolved']);
  assert(issues.unresolved['src/index.ts']['./unresolved']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    unlisted: 2,
    unresolved: 1,
    processed: 2,
    total: 2,
  });
});
