import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const cwd = resolve('fixtures/catalog-pnpm');

test('knip --reporter json (catalog)', () => {
  const json = {
    files: [],
    issues: [
      {
        file: 'pnpm-workspace.yaml',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [],
        binaries: [],
        unresolved: [],
        exports: [],
        types: [],
        enumMembers: {},
        duplicates: [],
        catalog: [{ name: 'lodash', line: 7, col: 3 }],
      },
    ],
  };

  const result: typeof json = JSON.parse(exec('knip --reporter json', { cwd }).stdout);

  assert.deepEqual(result, json);
});
