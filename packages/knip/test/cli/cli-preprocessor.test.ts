import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { exec } from '../helpers/exec.js';

const cwd = resolve('fixtures/cli-preprocessor');

test('knip --preprocessor ./index.js', () => {
  const { stdout } = exec('knip --preprocessor ./index.js', { cwd });
  assert.equal(stdout, 'hi from js preprocessor');
});

test('knip --preprocessor ./index.ts', () => {
  const { stdout } = exec('knip --preprocessor ./index.ts', { cwd });
  assert.equal(stdout, 'hi from ts preprocessor');
});

test.skip('knip --preprocessor knip-preprocessor', () => {
  const { stdout } = exec('knip --preprocessor knip-preprocessor', { cwd });
  assert.equal(stdout, 'hi from pkg preprocessor');
});

test.skip('knip --preprocessor @org/preprocessor', () => {
  const { stdout } = exec('knip --preprocessor @org/preprocessor', { cwd });
  assert.equal(stdout, 'hi from scoped preprocessor');
});

test.skip(`knip --preprocessor with-args --preprocessor-options {"food":"cupcake"}`, () => {
  const { stdout } = exec(`knip --preprocessor with-args --preprocessor-options {"food":"cupcake"}`, { cwd });
  assert.equal(stdout, 'hi from with-args preprocessor, you gave me: cupcake');
});
