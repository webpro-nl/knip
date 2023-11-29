import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../src/util/path.js';
import { execFactory } from './helpers/exec.js';
import { updatePos } from './helpers/index.js';

const cwd = resolve('fixtures/members');

const exec = execFactory(cwd);

test('knip --reporter json', () => {
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
            { name: 'B_Unused', line: 13, col: 3, pos: 167 },
            { name: 'D_Key', line: 15, col: 3, pos: 205 },
          ],
        },
        classMembers: {
          MyClass: [
            { name: 'bUnusedPublic', line: 28, col: 10, pos: 427 },
            { name: 'cUnusedProp', line: 33, col: 3, pos: 552 },
            { name: 'dUnusedMember', line: 40, col: 3, pos: 687 },
            { name: 'eUnusedStatic', line: 46, col: 10, pos: 804 },
            { name: 'unusedGetter', line: 57, col: 14, pos: 1001 },
            { name: 'unusedSetter', line: 61, col: 14, pos: 1071 },
          ],
        },
        duplicates: [],
      },
    ],
  };

  // Add line - 1 to every pos (each EOL is one more char)
  updatePos(json);

  assert.equal(exec('knip --reporter json').stdout, JSON.stringify(json) + '\n');
});
