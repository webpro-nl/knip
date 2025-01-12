import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/type-members2');

test('Find unused type and interface members', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.typeMembers['interfaces.ts']['MyInterface.keyB.subA']);
  assert(issues.typeMembers['types.ts']['MyType.keyB.subA']);

  assert.deepEqual(counters, {
    ...baseCounters,
    typeMembers: 2,
    processed: 3,
    total: 3,
  });
});
