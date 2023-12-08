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
            { name: 'B_Unused', line: 17, col: 3, pos: 248 },
            { name: 'D_Key', line: 19, col: 3, pos: 286 },
          ],
        },
        classMembers: {
          MyClass: [
            { name: 'bUnusedPublic', line: 32, col: 10, pos: 508 },
            { name: 'cUnusedProp', line: 37, col: 3, pos: 633 },
            { name: 'dUnusedMember', line: 44, col: 3, pos: 768 },
            { name: 'eUnusedStatic', line: 50, col: 10, pos: 885 },
            { name: 'unusedGetter', line: 61, col: 14, pos: 1082 },
            { name: 'unusedSetter', line: 65, col: 14, pos: 1152 },
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
