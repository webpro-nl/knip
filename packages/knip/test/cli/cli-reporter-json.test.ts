import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/exports');

test('knip --reporter json (exports & types)', () => {
  const json = {
    issues: [
      {
        file: 'default.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [],
        exports: [{ name: 'NamedExport', line: 1, col: 14, pos: 13 }],
        files: [],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [],
        unlisted: [],
        unresolved: [],
      },
      {
        file: 'dynamic-import.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [],
        exports: [{ name: 'unusedZero', line: 3, col: 14, pos: 39 }],
        files: [],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [],
        unlisted: [],
        unresolved: [],
      },
      {
        file: 'my-mix.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [],
        exports: [{ name: 'unusedInMix', line: 1, col: 14, pos: 13 }],
        files: [],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [],
        unlisted: [],
        unresolved: [],
      },
      {
        file: 'my-module.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [
          [
            { name: 'exportedResult', line: 26, col: 14, pos: 770 },
            { name: 'default', line: 30, col: 16, pos: 855 },
          ],
        ],
        enumMembers: [],
        exports: [
          { name: 'unusedNumber', line: 23, col: 14, pos: 682 },
          { name: 'unusedFunction', line: 24, col: 14, pos: 713 },
          { name: 'default', line: 30, col: 16, pos: 855 },
        ],
        files: [],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [{ name: 'MyAnyType', line: 28, col: 13, pos: 822 }],
        unlisted: [],
        unresolved: [],
      },
      {
        file: 'my-namespace.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [],
        exports: [{ namespace: 'MyNamespace', name: 'nsUnusedKey', line: 3, col: 14, pos: 84 }],
        files: [],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [{ namespace: 'MyNamespace', name: 'MyNamespace', line: 5, col: 18, pos: 119 }],
        unlisted: [],
        unresolved: [],
      },
      {
        file: 'named-exports.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [],
        exports: [
          { name: 'renamedExport', line: 6, col: 30, pos: 179 },
          { name: 'namedExport', line: 7, col: 15, pos: 215 },
        ],
        files: [],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [],
        unlisted: [],
        unresolved: [],
      },
      {
        file: 'types.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [],
        exports: [],
        files: [],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [
          { name: 'MyEnum', line: 3, col: 13, pos: 71 },
          { name: 'MyType', line: 8, col: 15, pos: 146 },
        ],
        unlisted: [],
        unresolved: [],
      },
    ],
  };

  const result: typeof json = JSON.parse(exec('knip --reporter json', { cwd }).stdout);
  result.issues = result.issues.sort((a, b) => a.file.localeCompare(b.file));

  assert.deepEqual(result, json);
});
