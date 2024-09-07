import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/exports');

const exec = execFactory(cwd);

test('knip --reporter json (exports & types)', () => {
  const json = {
    files: [],
    issues: [
      {
        file: 'my-module.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [
          { name: 'unusedNumber', line: 23, col: 14, pos: 682 },
          { name: 'unusedFunction', line: 24, col: 14, pos: 713 },
          { name: 'default', line: 30, col: 8, pos: 847 },
        ],
        types: [{ name: 'MyAnyType', line: 28, col: 13, pos: 822 }],
        enumMembers: {},
        duplicates: [
          [
            { name: 'exportedResult', line: 26, col: 13, pos: 769 },
            { name: 'default', line: 30, col: 15, pos: 854 },
          ],
        ],
      },
      {
        file: 'named-exports.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [
          { name: 'renamedExport', line: 6, col: 30, pos: 179 },
          { name: 'namedExport', line: 7, col: 15, pos: 215 },
        ],
        types: [],
        enumMembers: {},
        duplicates: [],
      },
      {
        file: 'dynamic-import.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [{ name: 'unusedZero', line: 3, col: 14, pos: 39 }],
        types: [],
        enumMembers: {},
        duplicates: [],
      },
      {
        file: 'my-mix.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [{ name: 'unusedInMix', line: 1, col: 14, pos: 13 }],
        types: [],
        enumMembers: {},
        duplicates: [],
      },
      {
        file: 'default.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [{ name: 'NamedExport', line: 1, col: 14, pos: 13 }],
        types: [],
        enumMembers: {},
        duplicates: [],
      },
      {
        file: 'my-namespace.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [{ name: 'nsUnusedKey', line: 3, col: 14, pos: 84 }],
        types: [{ name: 'MyNamespace', line: 5, col: 18, pos: 119 }],
        enumMembers: {},
        duplicates: [],
      },
      {
        file: 'types.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [],
        types: [
          { name: 'MyEnum', line: 3, col: 13, pos: 71 },
          { name: 'MyType', line: 8, col: 14, pos: 145 },
        ],
        enumMembers: {},
        duplicates: [],
      },
    ],
  };

  assert.equal(exec('knip --reporter json').stdout, `${JSON.stringify(json)}\n`);
});
