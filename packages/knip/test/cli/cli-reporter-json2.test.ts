import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter json (files, unlisted & unresolved)', () => {
  const json = {
    files: ['src/unused.ts'],
    issues: [
      {
        file: 'src/index.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [
          { name: 'unresolved', line: 9, col: 27, pos: 450 },
          { name: '@org/unresolved', line: 10, col: 27, pos: 490 },
        ],
        binaries: [],
        unresolved: [{ name: './unresolved', line: 8, col: 24, pos: 408 }],
        exports: [],
        types: [],
        enumMembers: {},
        namespaceMembers: {},
        duplicates: [],
        catalog: [],
      },
    ],
  };

  assert.equal(exec('knip --reporter json', { cwd }).stdout, JSON.stringify(json));
});
