import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/enum-members');

test('Find unused enum members', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.enumMembers['members.ts']).length, 2);
  assert(issues.enumMembers['members.ts']['MyEnum.B_Unused']);
  assert(issues.enumMembers['members.ts']['MyEnum.D-Key']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 2,
    processed: 2,
    total: 2,
  });
});

test('Find unused enum members (isIncludeEntryExports)', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.enumMembers['members.ts']).length, 2);
  assert(issues.enumMembers['members.ts']['MyEnum.B_Unused']);
  assert(issues.enumMembers['members.ts']['MyEnum.D-Key']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 2,
    processed: 2,
    total: 2,
  });
});
