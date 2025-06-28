import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

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
        unlisted: [{ name: 'unresolved' }, { name: '@org/unresolved' }],
        binaries: [],
        unresolved: [{ name: './unresolved', line: 8, col: 23, pos: 407 }],
        exports: [],
        types: [],
        enumMembers: {},
        duplicates: [],
      },
    ],
  };

  assert.equal(exec('knip --reporter json', { cwd }).stdout, JSON.stringify(json));
});
