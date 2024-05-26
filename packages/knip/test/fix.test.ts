import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { EOL } from 'node:os';
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

export const { ,  } = { a: 1, b: 1 };

export const [, ] = [1, 2];

class MyClass {}

/** @knipignore */
export type U = number;
`.replace(/\n/g, EOL),
    ],
    [
      'access.js',
      await readContents('access.js'),
      `module.exports.USED = 1;


`.replace(/\n/g, EOL),
    ],
    [
      'exports.js',
      await readContents('exports.js'),
      `const identifier = 1;
const identifier2 = 2;

module.exports = { identifier,  };
`.replace(/\n/g, EOL),
    ],
    [
      'reexports.js',
      await readContents('reexports.js'),
      `export { One } from './reexported';
`.replace(/\n/g, EOL),
    ],
    [
      'reexported.js',
      await readContents('reexported.js'),
      `const Two = 2;
const Three = 2;


export const One = 1;
`.replace(/\n/g, EOL),
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
`.replace(/\n/g, EOL),
    ],
  ];

  const { issues } = await main({
    ...baseArguments,
    cwd,
    isFix: true,
    tags: [[], ['knipignore']],
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

export const [c, d] = [1, 2];

export default class MyClass {}

/** @knipignore */
export type U = number;
`.replace(/\n/g, EOL),
    ],
  ];

  const { issues } = await main({
    ...baseArguments,
    cwd,
    isFix: true,
    fixTypes: ['types'],
    tags: [[], ['knipignore']],
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
