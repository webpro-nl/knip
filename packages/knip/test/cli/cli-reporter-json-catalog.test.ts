import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/catalog-pnpm');

test('knip --reporter json (catalog)', () => {
  const json = {
    issues: [
      {
        file: 'pnpm-workspace.yaml',
        binaries: [],
        catalog: [{ namespace: 'default', name: 'lodash', line: 7, col: 3 }],
        dependencies: [],
        devDependencies: [],
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

  const result: typeof json = JSON.parse(exec('knip --reporter json', { cwd }).stdout);

  assert.deepEqual(result, json);
});
