import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/tags');

test('Include or exclude tagged exports (default)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.exports['unimported.ts']['unimported']);
  assert(issues.exports['unimported.ts']['unimportedUntagged']);
  assert(issues.exports['tags.ts']['UnusedUntagged']);
  assert(issues.exports['tags.ts']['UnusedCustom']);
  assert(issues.exports['tags.ts']['UnusedInternal']);
  assert(issues.exports['tags.ts']['UnusedCustomAndInternal']);
  assert(issues.exports['tags.ts']['MyCustomClass']);
  assert(issues.classMembers['tags.ts']['MyClass.UnusedUntagged']);
  assert(issues.classMembers['tags.ts']['MyClass.UnusedCustom']);
  assert(issues.classMembers['tags.ts']['MyClass.UnusedInternal']);
  assert(issues.classMembers['tags.ts']['MyClass.UnusedCustomAndInternal']);
  assert(issues.enumMembers['tags.ts']['MyEnum.UnusedUntagged']);
  assert(issues.enumMembers['tags.ts']['MyEnum.UnusedCustom']);
  assert(issues.enumMembers['tags.ts']['MyEnum.UnusedInternal']);
  assert(issues.enumMembers['tags.ts']['MyEnum.UnusedCustomAndInternal']);
  assert(issues.types['tags.ts']['MyCustomEnum']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 7,
    types: 1,
    classMembers: 4,
    enumMembers: 4,
    processed: 3,
    total: 3,
  });
});

test('Include or exclude tagged exports (include)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    tags: [['custom'], []],
  });

  assert(issues.exports['unimported.ts']['unimported']);
  assert(issues.exports['tags.ts']['UnusedCustom']);
  assert(issues.exports['tags.ts']['UnusedCustomAndInternal']);
  assert(issues.exports['tags.ts']['MyCustomClass']);
  assert(issues.types['tags.ts']['MyCustomEnum']);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    types: 1,
    processed: 3,
    total: 3,
  });
});

test('Include or exclude tagged exports (exclude)', async () => {
  const { issues, counters, tagHints } = await main({
    ...baseArguments,
    cwd,
    tags: [[], ['custom']],
  });

  assert(issues.exports['unimported.ts']['unimportedUntagged']);
  assert(issues.exports['tags.ts']['UnusedUntagged']);
  assert(issues.exports['tags.ts']['UnusedInternal']);
  assert(issues.classMembers['tags.ts']['MyClass.UnusedUntagged']);
  assert(issues.classMembers['tags.ts']['MyClass.UnusedInternal']);
  assert(issues.enumMembers['tags.ts']['MyEnum.UnusedUntagged']);
  assert(issues.enumMembers['tags.ts']['MyEnum.UnusedInternal']);

  assert.deepEqual(
    tagHints,
    new Set([
      {
        type: 'tag',
        filePath: join(cwd, 'unimported.ts'),
        identifier: 'ignored',
        tagName: '@custom',
      },
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 3,
    classMembers: 2,
    enumMembers: 2,
    processed: 3,
    total: 3,
  });
});
