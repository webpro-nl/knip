import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/class-members');

test('Find unused class members', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.classMembers['members.ts']).length, 6);
  assert(issues.classMembers['iterator-generator.ts']['AbstractClassGen.unimplemented']);
  assert(issues.classMembers['iterator.ts']['AbstractClass.implemented']);
  assert(issues.classMembers['members.ts']['MyClass.bUnusedPublic']);
  assert(issues.classMembers['members.ts']['MyClass.cUnusedProp']);
  assert(issues.classMembers['members.ts']['MyClass.dUnusedMember']);
  assert(issues.classMembers['members.ts']['MyClass.eUnusedStatic']);
  assert(issues.classMembers['members.ts']['MyClass.unusedGetter']);
  assert(issues.classMembers['members.ts']['MyClass.unusedSetter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 8,
    processed: 5,
    total: 5,
  });
});

test('Find unused class members (isIncludeEntryExports)', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);

  assert.equal(Object.keys(issues.classMembers['members.ts']).length, 6);
  assert(issues.classMembers['iterator-generator.ts']['AbstractClassGen.unimplemented']);
  assert(issues.classMembers['iterator.ts']['AbstractClass.implemented']);
  assert(issues.classMembers['index.ts']['Parent.unusedMemberInEntry']);
  assert(issues.classMembers['members.ts']['MyClass.bUnusedPublic']);
  assert(issues.classMembers['members.ts']['MyClass.cUnusedProp']);
  assert(issues.classMembers['members.ts']['MyClass.dUnusedMember']);
  assert(issues.classMembers['members.ts']['MyClass.eUnusedStatic']);
  assert(issues.classMembers['members.ts']['MyClass.unusedGetter']);
  assert(issues.classMembers['members.ts']['MyClass.unusedSetter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 9,
    processed: 5,
    total: 5,
  });
});
