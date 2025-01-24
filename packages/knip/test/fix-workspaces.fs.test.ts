import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';

const cwd = resolve('fixtures/fix-workspaces');

const readContents = async (fileName: string) => await readFile(join(cwd, fileName), 'utf8');

test('Remove exports and dependencies (workspaces)', async () => {
  const tests = [
    [
      'exports.ts',
      await readContents('exports.ts'),
      `export const c = 1;
const d = 2;

type T = number;

/** @lintignore */
export type U = number;
`,
    ],
    [
      'package.json',
      await readContents('package.json'),
      `{
  "name": "@fixtures/fix-workspaces",
  "dependencies": {
    "ignored": "*"
  },
  "workspaces": [
    "packages/*"
  ]
}
`,
    ],
    [
      'packages/lib/exports.ts',
      await readContents('packages/lib/exports.ts'),
      `export const c = 1;
const d = 2;

type T = number;

/** @lintignore */
export type U = number;
`,
    ],
    [
      'packages/lib/package.json',
      await readContents('packages/lib/package.json'),
      `{
  "name": "@org/lib",
  "dependencies": {
    "ignored": "*"
  }
}
`,
    ],
  ];

  const { issues } = await main({
    ...baseArguments,
    cwd,
    isFix: true,
    tags: [[], ['lintignore']],
  });

  assert(issues.exports['exports.ts']['d']);
  assert(issues.exports['packages/lib/exports.ts']['d']);
  assert(issues.types['exports.ts']['T']);
  assert(issues.types['packages/lib/exports.ts']['T']);

  assert(issues.dependencies['package.json']['unused']);
  assert(issues.dependencies['packages/lib/package.json']['unused']);

  // check ignore
  assert(issues.exports['ignored.ts'] === undefined);
  assert(issues.exports['packages/lib/ignored.ts'] === undefined);

  // check ignoreDependencies
  assert(issues.dependencies['package.json']['ignored'] === undefined);
  assert(issues.dependencies['packages/lib/package.json']['ignored'] === undefined);

  // check ignoreWorkspaces
  assert(issues.exports['packages/ignored/package.json'] === undefined);
  assert(issues.exports['packages/ignored/exports.ts'] === undefined);

  // check ignored by tags
  assert(issues.types['exports.ts']['U'] === undefined);
  assert(issues.types['packages/lib/exports.ts']['U'] === undefined);

  for (const [fileName, before, after] of tests) {
    const filePath = join(cwd, fileName);
    const originalFile = await readFile(filePath);
    assert.equal(String(originalFile), after);
    await writeFile(filePath, before);
  }
});

test('Remove exports (--fix-type types)', async () => {
  const tests = [
    [
      'exports.ts',
      await readContents('exports.ts'),
      `export const c = 1;
export const d = 2;

type T = number;

/** @lintignore */
export type U = number;
`,
    ],
    [
      'packages/lib/exports.ts',
      await readContents('packages/lib/exports.ts'),
      `export const c = 1;
export const d = 2;

type T = number;

/** @lintignore */
export type U = number;
`,
    ],
  ];

  const { issues } = await main({
    ...baseArguments,
    cwd,
    isFix: true,
    fixTypes: ['types'],
    tags: [[], ['lintignore']],
  });

  assert(issues.exports['exports.ts']['d']);
  assert(issues.exports['packages/lib/exports.ts']['d']);
  assert(issues.types['exports.ts']['T']);
  assert(issues.types['packages/lib/exports.ts']['T']);

  assert(issues.dependencies['package.json']['unused']);
  assert(issues.dependencies['packages/lib/package.json']['unused']);

  // check ignore
  assert(issues.exports['ignored.ts'] === undefined);
  assert(issues.exports['packages/lib/ignored.ts'] === undefined);

  // check ignoreDependencies
  assert(issues.dependencies['package.json']['ignored'] === undefined);
  assert(issues.dependencies['packages/lib/package.json']['ignored'] === undefined);

  // check ignoreWorkspaces
  assert(issues.exports['packages/ignored/package.json'] === undefined);
  assert(issues.exports['packages/ignored/exports.ts'] === undefined);

  // check ignored by tags
  assert(issues.types['exports.ts']['U'] === undefined);
  assert(issues.types['packages/lib/exports.ts']['U'] === undefined);

  for (const [fileName, before, after] of tests) {
    const filePath = join(cwd, fileName);
    const originalFile = await readFile(filePath);
    assert.equal(String(originalFile), after);
    await writeFile(filePath, before);
  }
});
