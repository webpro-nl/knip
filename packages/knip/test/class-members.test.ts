import assert from 'node:assert/strict';
import test from 'node:test';
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
  assert(issues.classMembers['iterator-generator.ts']['unimplemented']);
  assert(issues.classMembers['members.ts']['bUnusedPublic']);
  assert(issues.classMembers['members.ts']['cUnusedProp']);
  assert(issues.classMembers['members.ts']['dUnusedMember']);
  assert(issues.classMembers['members.ts']['eUnusedStatic']);
  assert(issues.classMembers['members.ts']['unusedGetter']);
  assert(issues.classMembers['members.ts']['unusedSetter']);

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
  assert(issues.classMembers['iterator-generator.ts']['unimplemented']);
  assert(issues.classMembers['index.ts']['unusedMemberInEntry']);
  assert(issues.classMembers['members.ts']['bUnusedPublic']);
  assert(issues.classMembers['members.ts']['cUnusedProp']);
  assert(issues.classMembers['members.ts']['dUnusedMember']);
  assert(issues.classMembers['members.ts']['eUnusedStatic']);
  assert(issues.classMembers['members.ts']['unusedGetter']);
  assert(issues.classMembers['members.ts']['unusedSetter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    classMembers: 8,
    processed: 4,
    total: 4,
  });
});
