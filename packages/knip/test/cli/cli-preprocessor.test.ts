import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { execFactory } from '../helpers/exec.js';

const cwd = resolve('fixtures/cli-preprocessor');

const exec = execFactory(cwd);

test('knip --preprocessor ./index.js', () => {
  const { stdout } = exec('knip --preprocessor ./index.js');
  assert.equal(stdout, 'hi from js preprocessor');
});

test('knip --preprocessor ./index.ts', () => {
  const { stdout } = exec('knip --preprocessor ./index.ts');
  assert.equal(stdout, 'hi from ts preprocessor');
});

test('knip --preprocessor knip-preprocessor', () => {
  const { stdout } = exec('knip --preprocessor knip-preprocessor');
  assert.equal(stdout, 'hi from pkg preprocessor');
});

test('knip --preprocessor @org/preprocessor', () => {
  const { stdout } = exec('knip --preprocessor @org/preprocessor');
  assert.equal(stdout, 'hi from scoped preprocessor');
});

test(`knip --preprocessor with-args --preprocessor-options {"food":"cupcake"}`, () => {
  const { stdout } = exec(`knip --preprocessor with-args --preprocessor-options {\\"food\\":\\"cupcake\\"}`);
  assert.equal(stdout, 'hi from with-args preprocessor, you gave me: cupcake');
});
