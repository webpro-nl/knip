import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

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
          { name: 'unresolved', line: 9, col: 27, pos: 449 },
          { name: '@org/unresolved', line: 10, col: 27, pos: 489 },
        ],
        binaries: [],
        unresolved: [{ name: './unresolved', line: 8, col: 24, pos: 407 }],
        exports: [],
        types: [],
        enumMembers: {},
        duplicates: [],
      },
    ],
  };

  assert.equal(exec('knip --reporter json', { cwd }).stdout, JSON.stringify(json));
});
