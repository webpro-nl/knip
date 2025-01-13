import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';

const cwd = resolve('fixtures/fix-type-members');

const readContents = async (fileName: string) => await readFile(join(cwd, fileName), 'utf8');

test('Remove type and interface members', async () => {
  const tests = [
    [
      'types.ts',
      await readContents('types.ts'),
      `export type TypeWithMembers = {
  usedMember: string;
  /** @public */
  ignoredByTag: string;
};

export type TypeWithUnion = {
  usedUnionMember: string | number;
  };

export type TypeWithIntersection = {
  usedIntersectionMember: string & { prop: string };
  };
`,
    ],
    [
      'interfaces.ts',
      await readContents('interfaces.ts'),
      `export interface InterfaceWithMembers {
  usedMember: string;
  /** @public */
  ignoredByTag: string;
}

export interface InterfaceWithMethods {
  usedMethod(): void;
  }

export interface InterfaceWithIndexSignature {
  [key: string]: unknown;
  usedProp: string;
  }
`,
    ],
  ];

  const { issues } = await main({
    ...baseArguments,
    cwd,
    includedIssueTypes: ['typeMembers'],
    isFix: true,
  });

  assert(issues.typeMembers['types.ts']['TypeWithMembers.unusedMember']);
  assert(issues.typeMembers['types.ts']['TypeWithUnion.unusedUnionMember']);
  assert(issues.typeMembers['types.ts']['TypeWithIntersection.unusedIntersectionMember']);

  assert(issues.typeMembers['interfaces.ts']['InterfaceWithMembers.unusedMember']);
  assert(issues.typeMembers['interfaces.ts']['InterfaceWithMethods.unusedMethod']);
  assert(issues.typeMembers['interfaces.ts']['InterfaceWithIndexSignature.unusedProp']);

  for (const [fileName, before, after] of tests) {
    const filePath = join(cwd, fileName);
    const originalFile = await readFile(filePath);
    assert.equal(String(originalFile), after);
    await writeFile(filePath, before);
  }
});
