import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/enum-members');

test('knip --reporter json (enum members)', () => {
  const json = {
    issues: [
      {
        file: 'members.ts',
        binaries: [],
        catalog: [],
        dependencies: [],
        devDependencies: [],
        duplicates: [],
        enumMembers: [
          { namespace: 'MyEnum', name: 'B_Unused', line: 9, col: 3, pos: 127 },
          { namespace: 'MyEnum', name: 'D-Key', line: 11, col: 3, pos: 165 },
        ],
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
