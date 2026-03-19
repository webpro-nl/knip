import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies');

test('knip --reporter json (dependencies)', () => {
  const json = {
    issues: [
      {
        file: 'unused-module.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [],
        exports: [],
        files: [{ name: 'unused-module.ts' }],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [],
        unlisted: [],
        unresolved: [],
      },
      {
        file: 'package.json',
        binaries: [{ name: 'jest' }, { name: 'start-server' }],
        catalog: [],
        dependencies: [
          { name: '@tootallnate/once', line: 8, col: 6, pos: 131 },
          { name: 'fs-extra', line: 10, col: 6, pos: 190 },
        ],
        devDependencies: [{ name: 'mocha', line: 23, col: 6, pos: 422 }],
        duplicates: [],
        enumMembers: [],
        exports: [],
        files: [],
        namespaceMembers: [],
        optionalPeerDependencies: [],
        types: [],
        unlisted: [],
        unresolved: [],
      },
    ],
  };

  assert.equal(exec('knip --reporter json', { cwd }).stdout, JSON.stringify(json));
});
