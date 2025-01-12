import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/class-members');

test('Find unused class members', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert.equal(Object.keys(issues.classMembers['members.ts']).length, 6);
  assert(issues.classMembers['iterator-generator.ts']['AbstractClassGen.unimplemented']);
  assert(issues.classMembers['members.ts']['MyClass.bUnusedPublic']);
  assert(issues.classMembers['members.ts']['MyClass.cUnusedProp']);
  assert(issues.classMembers['members.ts']['MyClass.dUnusedMember']);
  assert(issues.classMembers['members.ts']['MyClass.eUnusedStatic']);
  assert(issues.classMembers['members.ts']['MyClass.unusedGetter']);
  assert(issues.classMembers['members.ts']['MyClass.unusedSetter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 7,
    processed: 4,
    total: 4,
  });
});

test('Find unused class members (isIncludeEntryExports)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

  assert.equal(Object.keys(issues.classMembers['members.ts']).length, 6);
  assert(issues.classMembers['iterator-generator.ts']['AbstractClassGen.unimplemented']);
  assert(issues.classMembers['index.ts']['Parent.unusedMemberInEntry']);
  assert(issues.classMembers['members.ts']['MyClass.bUnusedPublic']);
  assert(issues.classMembers['members.ts']['MyClass.cUnusedProp']);
  assert(issues.classMembers['members.ts']['MyClass.dUnusedMember']);
  assert(issues.classMembers['members.ts']['MyClass.eUnusedStatic']);
  assert(issues.classMembers['members.ts']['MyClass.unusedGetter']);
  assert(issues.classMembers['members.ts']['MyClass.unusedSetter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 8,
    processed: 4,
    total: 4,
  });
});
