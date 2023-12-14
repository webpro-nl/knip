import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../src/util/path.js';
import { execFactory } from './helpers/exec.js';
import { updatePos } from './helpers/index.js';

const cwd = resolve('fixtures/enum-members');

const exec = execFactory(cwd);

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
            { name: 'B_Unused', line: 7, col: 13, pos: 94 },
            { name: 'D_Key', line: 7, col: 13, pos: 94 },
          ],
        },
        classMembers: {},
        duplicates: [],
      },
    ],
  };

  // Add line - 1 to every pos (each EOL is one more char)
  updatePos(json);

  assert.equal(exec('knip --reporter json').stdout, JSON.stringify(json) + '\n');
});
