import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Fix exports and dependencies', async () => {
  const cwd = await copyFixture('fixtures/fix');
  const options = await createOptions({ cwd, tags: ['-lintignore'], isFix: true });
  const { issues } = await main(options);

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

  assert(issues.exports['ignored.ts'] === undefined);
  assert(issues.dependencies['package.json']['ignored'] === undefined);
  assert(issues.types['mod.ts']['U'] === undefined);

  assert.equal(
    await readFile(join(cwd, 'mod.ts'), 'utf8'),
    `const x = 1;
const y = 2;

// biome-ignore lint: suspicious/noEmptyInterface
interface McInterFace {}
// biome-ignore lint: complexity/noBannedTypes
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
`
  );

  assert.equal(
    await readFile(join(cwd, 'access.js'), 'utf8'),
    `module.exports.USED = 1;


`
  );

  assert.equal(
    await readFile(join(cwd, 'default-x.mjs'), 'utf8'),
    `const x = 1;


export const dx = 1;
`
  );

  assert.equal(await readFile(join(cwd, 'default.mjs'), 'utf8'), `export const d = 1;\n`);

  assert.equal(
    await readFile(join(cwd, 'exports.js'), 'utf8'),
    `const identifier = 1;
const identifier2 = 2;

module.exports = { identifier,  };
`
  );

  assert.equal(
    await readFile(join(cwd, 'reexports.mjs'), 'utf8'),
    `;
;
export { One, Rectangle,    Nine,   setter } from './reexported';
;
;
`
  );

  assert.equal(
    await readFile(join(cwd, 'reexported.ts'), 'utf8'),
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
`
  );

  assert.equal(
    await readFile(join(cwd, 'package.json'), 'utf8'),
    `{
  "name": "@fixtures/fix",
  "dependencies": {
    "lodash": "*",
    "ignored": "*"
  },
  "devDependencies": {}
}
`
  );
});

test('Fix only exported types', async () => {
  const cwd = await copyFixture('fixtures/fix');
  const options = await createOptions({ cwd, tags: ['-lintignore'], isFix: true, fixTypes: ['types'] });
  const { issues } = await main(options);

  assert(issues.exports['access.js']['ACCESS']);
  assert(issues.exports['access.js']['UNUSED']);
  assert(issues.exports['exports.js']['identifier2']);
  assert(issues.exports['mod.ts']['a']);
  assert(issues.exports['mod.ts']['b']);
  assert(issues.exports['mod.ts']['default']);
  assert(issues.exports['mod.ts']['x']);
  assert(issues.exports['mod.ts']['y']);

  assert(issues.exports['ignored.ts'] === undefined);
  assert(issues.dependencies['package.json']['ignored'] === undefined);
  assert(issues.types['mod.ts']['U'] === undefined);

  assert.equal(
    await readFile(join(cwd, 'mod.ts'), 'utf8'),
    `export const x = 1;
export const y = 2;

// biome-ignore lint: suspicious/noEmptyInterface
interface McInterFace {}
// biome-ignore lint: complexity/noBannedTypes
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
`
  );

  assert.equal(
    await readFile(join(cwd, 'reexported.ts'), 'utf8'),
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
`
  );
});
