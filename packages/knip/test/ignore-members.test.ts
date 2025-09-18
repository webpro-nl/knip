import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-members');

test('Respect ignored members, including string-to-regex, show config hints', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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
  const options = await createOptions({ cwd, isProduction: true });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 1,
    enumMembers: 1,
    processed: 4,
    total: 4,
  });

  assert.deepEqual(configurationHints, new Set());
});
