import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import { copyFixture } from '../helpers/copy-fixture.js';
import { createOptions } from '../helpers/create-options.js';

test('Fix exports and dependencies in workspaces', async () => {
  const cwd = await copyFixture('fixtures/fix-workspaces');
  const options = await createOptions({ cwd, tags: ['-lintignore'], isFix: true });
  const { issues } = await main(options);

  assert(issues.exports['exports.ts']['d']);
  assert(issues.exports['packages/lib/exports.ts']['d']);
  assert(issues.types['exports.ts']['T']);
  assert(issues.types['packages/lib/exports.ts']['T']);
  assert(issues.dependencies['package.json']['unused']);
  assert(issues.dependencies['packages/lib/package.json']['unused']);

  assert(issues.exports['ignored.ts'] === undefined);
  assert(issues.exports['packages/lib/ignored.ts'] === undefined);
  assert(issues.dependencies['package.json']['ignored'] === undefined);
  assert(issues.dependencies['packages/lib/package.json']['ignored'] === undefined);
  assert(issues.exports['packages/ignored/package.json'] === undefined);
  assert(issues.exports['packages/ignored/exports.ts'] === undefined);
  assert(issues.types['exports.ts']['U'] === undefined);
  assert(issues.types['packages/lib/exports.ts']['U'] === undefined);

  assert.equal(
    await readFile(join(cwd, 'exports.ts'), 'utf8'),
    `export const c = 1;
const d = 2;

type T = number;

/** @lintignore */
export type U = number;
`
  );

  assert.equal(
    await readFile(join(cwd, 'package.json'), 'utf8'),
    `{
  "name": "@fixtures/fix-workspaces",
  "dependencies": {
    "ignored": "*"
  },
  "workspaces": [
    "packages/*"
  ]
}
`
  );

  assert.equal(
    await readFile(join(cwd, 'packages/lib/exports.ts'), 'utf8'),
    `export const c = 1;
const d = 2;

type T = number;

/** @lintignore */
export type U = number;
`
  );

  assert.equal(
    await readFile(join(cwd, 'packages/lib/package.json'), 'utf8'),
    `{
  "name": "@fixtures/fix-workspaces__lib",
  "dependencies": {
    "ignored": "*"
  }
}
`
  );
});

test('Fix exported types in workspaces', async () => {
  const cwd = await copyFixture('fixtures/fix-workspaces');
  const options = await createOptions({ cwd, tags: ['-lintignore'], isFix: true, fixTypes: ['types'] });
  const { issues } = await main(options);

  assert(issues.exports['exports.ts']['d']);
  assert(issues.exports['packages/lib/exports.ts']['d']);
  assert(issues.types['exports.ts']['T']);
  assert(issues.types['packages/lib/exports.ts']['T']);
  assert(issues.dependencies['package.json']['unused']);
  assert(issues.dependencies['packages/lib/package.json']['unused']);

  assert(issues.exports['ignored.ts'] === undefined);
  assert(issues.exports['packages/lib/ignored.ts'] === undefined);
  assert(issues.dependencies['package.json']['ignored'] === undefined);
  assert(issues.dependencies['packages/lib/package.json']['ignored'] === undefined);
  assert(issues.exports['packages/ignored/package.json'] === undefined);
  assert(issues.exports['packages/ignored/exports.ts'] === undefined);
  assert(issues.types['exports.ts']['U'] === undefined);
  assert(issues.types['packages/lib/exports.ts']['U'] === undefined);

  assert.equal(
    await readFile(join(cwd, 'exports.ts'), 'utf8'),
    `export const c = 1;
export const d = 2;

type T = number;

/** @lintignore */
export type U = number;
`
  );

  assert.equal(
    await readFile(join(cwd, 'packages/lib/exports.ts'), 'utf8'),
    `export const c = 1;
export const d = 2;

type T = number;

/** @lintignore */
export type U = number;
`
  );
});
