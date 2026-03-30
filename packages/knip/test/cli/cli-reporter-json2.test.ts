import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter json (files, unlisted & unresolved)', () => {
  const json = {
    issues: [
      {
        file: 'src/unused.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [],
        exports: [],
        files: [{ name: 'src/unused.ts' }],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [],
        unlisted: [],
        unresolved: [],
      },
      {
        file: 'src/index.ts',
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
        types: [],
        unlisted: [
          { name: 'unresolved', line: 9, col: 27, pos: 450 },
          { name: '@org/unresolved', line: 10, col: 27, pos: 490 },
        ],
        unresolved: [{ name: './unresolved', line: 8, col: 24, pos: 408 }],
      },
    ],
  };

  assert.equal(exec('knip --reporter json', { cwd }).stdout, JSON.stringify(json));
});
