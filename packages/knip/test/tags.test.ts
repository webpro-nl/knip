import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/tags');

test('Include or exclude tagged exports (default)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.nsExports['tags.ts']['UnusedUntagged']);
  assert(issues.nsExports['tags.ts']['UnusedCustom']);
  assert(issues.nsExports['tags.ts']['UnusedInternal']);
  assert(issues.nsExports['tags.ts']['UnusedCustomAndInternal']);
  assert(issues.classMembers['tags.ts']['UnusedUntagged']);
  assert(issues.classMembers['tags.ts']['UnusedCustom']);
  assert(issues.classMembers['tags.ts']['UnusedInternal']);
  assert(issues.classMembers['tags.ts']['UnusedCustomAndInternal']);
  assert(issues.enumMembers['tags.ts']['UnusedUntagged']);
  assert(issues.enumMembers['tags.ts']['UnusedCustom']);
  assert(issues.enumMembers['tags.ts']['UnusedInternal']);
  assert(issues.enumMembers['tags.ts']['UnusedCustomAndInternal']);

  assert.deepEqual(counters, {
    ...baseCounters,
    nsExports: 4,
    classMembers: 4,
    enumMembers: 4,
    processed: 2,
    total: 2,
  });
});

test('Include or exclude tagged exports (include)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    tags: [['custom'], []],
  });

  assert(issues.nsExports['tags.ts']['UnusedCustom']);
  assert(issues.nsExports['tags.ts']['UnusedCustomAndInternal']);
  assert(issues.classMembers['tags.ts']['UnusedCustom']);
  assert(issues.classMembers['tags.ts']['UnusedCustomAndInternal']);
  assert(issues.enumMembers['tags.ts']['UnusedCustom']);
  assert(issues.enumMembers['tags.ts']['UnusedCustomAndInternal']);

  assert.deepEqual(counters, {
    ...baseCounters,
    nsExports: 2,
    classMembers: 2,
    enumMembers: 2,
    processed: 2,
    total: 2,
  });
});

test('Include or exclude tagged exports (exclude)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    tags: [[], ['custom']],
  });

  assert(issues.nsExports['tags.ts']['UnusedUntagged']);
  assert(issues.nsExports['tags.ts']['UnusedInternal']);
  assert(issues.classMembers['tags.ts']['UnusedUntagged']);
  assert(issues.classMembers['tags.ts']['UnusedInternal']);
  assert(issues.enumMembers['tags.ts']['UnusedUntagged']);
  assert(issues.enumMembers['tags.ts']['UnusedInternal']);

  assert.deepEqual(counters, {
    ...baseCounters,
    nsExports: 2,
    classMembers: 2,
    enumMembers: 2,
    processed: 2,
    total: 2,
  });
});
