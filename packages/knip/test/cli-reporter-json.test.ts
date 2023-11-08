import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../src/util/path.js';
import { execFactory } from './helpers/execKnip.js';
import { updatePos } from './helpers/index.js';

const cwd = resolve('fixtures/exports');

const exec = execFactory(cwd);

test('knip --reporter json', () => {
  const json = {
    files: [],
    issues: [
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
        classMembers: {},
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
        classMembers: {},
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
        classMembers: {},
        duplicates: [],
      },
      {
        file: 'my-module.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [
          { name: 'unusedNumber', line: 14, col: 14, pos: 562 },
          { name: 'unusedFunction', line: 15, col: 14, pos: 593 },
          { name: 'default', line: 21, col: 8, pos: 727 },
        ],
        types: [{ name: 'MyAnyType', line: 19, col: 13, pos: 702 }],
        enumMembers: {},
        classMembers: {},
        duplicates: [[{ name: 'exportedResult' }, { name: 'default' }]],
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
        classMembers: {},
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
        classMembers: {},
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
        classMembers: {},
        duplicates: [],
      },
    ],
  };

  // Add line - 1 to every pos (each EOL is one more char)
  updatePos(json);

  assert.equal(exec('knip --reporter json'), JSON.stringify(json) + '\n');
});
