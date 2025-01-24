import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';

const cwd = resolve('fixtures/fix');

const readContents = async (fileName: string) => await readFile(join(cwd, fileName), 'utf8');

test('Remove exports and dependencies', async () => {
  const tests = [
    [
      'mod.ts',
      await readContents('mod.ts'),
      `const x = 1;
const y = 2;

interface McInterFace {}
type McType = {};
enum McEnum {}

export const z = x + y;

export const {   } = { a: 1, b: 1 };

export const [, ] = [3, 4];

export const [, f] = [5, 6];

export const [g, , i] = [7, 8, 9];

class MyClass {}

/** @lintignore */
export type U = number;
`,
    ],
    [
      'access.js',
      await readContents('access.js'),
      `module.exports.USED = 1;


`,
    ],
    [
      'default-x.mjs',
      await readContents('default-x.mjs'),
      `const x = 1;


export const dx = 1;
`,
    ],
    [
      'default.mjs',
      await readContents('default.mjs'),
      `export const d = 1;
`,
    ],
    [
      'exports.js',
      await readContents('exports.js'),
      `const identifier = 1;
const identifier2 = 2;

module.exports = { identifier,  };
`,
    ],
    [
      'reexports.mjs',
      await readContents('reexports.mjs'),
      `;
;
export { One, Rectangle,    Nine,   setter } from './reexported';
;
;
`,
    ],
    [
      'reexported.ts',
      await readContents('reexported.ts'),
      `const Two = 2;
const Three = 3;
const Four = 4;
const Five = 5;

;

;

export { Four as Rectangle,  };

type Six = any;
type Seven = unknown;
const Eight = 8;
const Nine = 9;
type Ten = unknown[];
;

export {   Nine,  };

export const One = 1;

const fn = () => ({ get: () => 1, set: () => 1 });

export const {  set: setter } = fn();
`,
    ],
    [
      'package.json',
      await readContents('package.json'),
      `{
  "name": "@fixtures/fix",
  "dependencies": {
    "lodash": "*",
    "ignored": "*"
  },
  "devDependencies": {}
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

  assert(issues.exports['access.js']['UNUSED']);
  assert(issues.exports['access.js']['ACCESS']);
  assert(issues.exports['exports.js']['identifier2']);
  assert(issues.exports['mod.ts']['a']);
  assert(issues.exports['mod.ts']['b']);
  assert(issues.exports['mod.ts']['c']);
  assert(issues.exports['mod.ts']['d']);
  assert(issues.exports['mod.ts']['default']);
  assert(issues.exports['mod.ts']['x']);
  assert(issues.exports['mod.ts']['y']);
  assert(issues.exports['reexported.ts']['Three']);
  assert(issues.exports['reexported.ts']['Two']);

  // check ignore
  assert(issues.exports['ignored.ts'] === undefined);

  // check ignoreDependencies
  assert(issues.dependencies['package.json']['ignored'] === undefined);

  // check ignored by tags
  assert(issues.types['mod.ts']['U'] === undefined);

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
      'mod.ts',
      await readContents('mod.ts'),
      `export const x = 1;
export const y = 2;

interface McInterFace {}
type McType = {};
enum McEnum {}

export const z = x + y;

export const { a, b } = { a: 1, b: 1 };

export const [c, d] = [3, 4];

export const [e, f] = [5, 6];

export const [g, h, i] = [7, 8, 9];

export default class MyClass {}

/** @lintignore */
export type U = number;
`,
    ],
    [
      'reexported.ts',
      await readContents('reexported.ts'),
      `const Two = 2;
const Three = 3;
const Four = 4;
const Five = 5;

export { Two, Three };

export { Four as Fourth, Five as Fifth };

export { Four as Rectangle, Five as Pentagon };

type Six = any;
type Seven = unknown;
const Eight = 8;
const Nine = 9;
type Ten = unknown[];
;

export {  Eight, Nine,  };

export const One = 1;

const fn = () => ({ get: () => 1, set: () => 1 });

export const { get: getter, set: setter } = fn();
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

  assert(issues.exports['access.js']['ACCESS']);
  assert(issues.exports['access.js']['UNUSED']);
  assert(issues.exports['exports.js']['identifier2']);
  assert(issues.exports['mod.ts']['a']);
  assert(issues.exports['mod.ts']['b']);
  assert(issues.exports['mod.ts']['default']);
  assert(issues.exports['mod.ts']['x']);
  assert(issues.exports['mod.ts']['y']);

  // check ignore
  assert(issues.exports['ignored.ts'] === undefined);

  // check ignoreDependencies
  assert(issues.dependencies['package.json']['ignored'] === undefined);

  // check ignored by tags
  assert(issues.types['mod.ts']['U'] === undefined);

  for (const [fileName, before, after] of tests) {
    const filePath = join(cwd, fileName);
    const actual = await readFile(filePath, 'utf8');
    assert.equal(actual, after);
    await writeFile(filePath, before);
  }
});
