import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/dependencies');

const exec = execFactory(cwd);

test('knip --reporter json (dependencies)', () => {
  const json = {
    files: ['unused-module.ts'],
    issues: [
      {
        file: 'package.json',
        dependencies: [
          { name: '@tootallnate/once', line: 8, col: 6, pos: 131 },
          { name: 'fs-extra', line: 10, col: 6, pos: 190 },
        ],
        devDependencies: [{ name: 'mocha', line: 23, col: 6, pos: 422 }],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [{ name: 'jest' }, { name: 'start-server' }],
        unresolved: [],
        exports: [],
        types: [],
        enumMembers: {},
        duplicates: [],
      },
    ],
  };

  assert.equal(exec('knip --reporter json').stdout, `${JSON.stringify(json)}\n`);
});
