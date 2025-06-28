import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const cwd = resolve('fixtures/enum-members');

test('knip --reporter json (enum members)', () => {
  const json = {
    files: [],
    issues: [
      {
        file: 'members.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [],
        types: [],
        enumMembers: {
          MyEnum: [
            { name: 'B_Unused', line: 9, col: 3, pos: 127 },
            { name: 'D-Key', line: 11, col: 3, pos: 165 },
          ],
        },
        duplicates: [],
      },
    ],
  };

  assert.equal(exec('knip --reporter json', { cwd }).stdout, JSON.stringify(json));
});
