import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/ignore-members');

test('Respect ignored members, including string-to-regex, show config hints', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.classMembers['MyClass.ts']['MyClass.implemented']);
  assert(issues.enumMembers['enums.ts']['Direction.Down']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 1,
    enumMembers: 1,
    processed: 4,
    total: 4,
  });
});

test('Respect ignored members, including string-to-regex, show config hints (production)', async () => {
  const { counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 1,
    enumMembers: 1,
    processed: 4,
    total: 4,
  });

  assert.deepEqual(configurationHints, new Set());
});
