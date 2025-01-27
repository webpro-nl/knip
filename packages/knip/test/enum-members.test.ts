import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/enum-members');

test('Find unused enum members', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.keys(issues.enumMembers['members.ts']).length, 2);
  assert(issues.enumMembers['members.ts']['MyEnum.B_Unused']);
  assert(issues.enumMembers['members.ts']['MyEnum.D_Key']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 2,
    processed: 2,
    total: 2,
  });
});

test('Find unused enum members (isIncludeEntryExports)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert.equal(Object.keys(issues.enumMembers['members.ts']).length, 2);
  assert(issues.enumMembers['members.ts']['MyEnum.B_Unused']);
  assert(issues.enumMembers['members.ts']['MyEnum.D_Key']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 2,
    processed: 2,
    total: 2,
  });
});
