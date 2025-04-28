import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const cwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter githubActions (files, unlisted & unresolved)', () => {
  assert.equal(
    exec('knip --reporter githubActions', { cwd }).stdout,
    `${cwd}/src/unused.ts
::error file=${cwd}/src/index.ts::Unlisted dependencies
::error file=${cwd}/src/index.ts::Unlisted dependencies
::error file=${cwd}/src/index.ts,line=8,endLine=8,col=23,endColumn=23::Unresolved imports`
  );
});
