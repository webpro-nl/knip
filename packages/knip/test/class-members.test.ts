import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/class-members');

test('Find unused class members', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.classMembers['iterator-generator.ts']['AbstractClassGen.unimplemented']);
  assert(issues.classMembers['iterator.ts']['AbstractClass.implemented']);
  assert(issues.classMembers['members.ts']['MyComponentClass.bUnusedPublic']);
  assert(issues.classMembers['members.ts']['MyComponentClass.bWriteOnlyPublic']);
  assert(issues.classMembers['members.ts']['MyComponentClass.cWriteOnlyPublic']);
  assert(issues.classMembers['members.ts']['MyComponentClass.cUnusedProp']);
  assert(issues.classMembers['members.ts']['MyComponentClass.dUnusedMember']);
  assert(issues.classMembers['members.ts']['MyComponentClass.eUnusedStatic']);
  assert(issues.classMembers['members.ts']['MyComponentClass.unusedGetter']);
  assert(issues.classMembers['members.ts']['MyComponentClass.unusedSetter']);
  assert(issues.classMembers['members.ts']['MyClass.unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 11,
    processed: 5,
    total: 5,
  });
});

test('Find unused class members (isIncludeEntryExports)', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert(issues.classMembers['iterator-generator.ts']['AbstractClassGen.unimplemented']);
  assert(issues.classMembers['iterator.ts']['AbstractClass.implemented']);
  assert(issues.classMembers['index.ts']['Parent.unusedMemberInEntry']);
  assert(issues.classMembers['members.ts']['MyComponentClass.bUnusedPublic']);
  assert(issues.classMembers['members.ts']['MyComponentClass.bWriteOnlyPublic']);
  assert(issues.classMembers['members.ts']['MyComponentClass.cWriteOnlyPublic']);
  assert(issues.classMembers['members.ts']['MyComponentClass.cUnusedProp']);
  assert(issues.classMembers['members.ts']['MyComponentClass.dUnusedMember']);
  assert(issues.classMembers['members.ts']['MyComponentClass.eUnusedStatic']);
  assert(issues.classMembers['members.ts']['MyComponentClass.unusedGetter']);
  assert(issues.classMembers['members.ts']['MyComponentClass.unusedSetter']);
  assert(issues.classMembers['members.ts']['MyClass.unused']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 12,
    processed: 5,
    total: 5,
  });
});
