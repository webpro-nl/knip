import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const skipIfBun = typeof Bun !== 'undefined' ? test.skip : test;

const cwd = resolve('fixtures/cli-preprocessor');

test('knip --preprocessor ./index.js', () => {
  const { stdout } = exec('knip --preprocessor ./index.js', { cwd });
  assert.equal(stdout, 'hi from js preprocessor');
});

test('knip --preprocessor ./index.ts', () => {
  const { stdout } = exec('knip --preprocessor ./index.ts', { cwd });
  assert.equal(stdout, 'hi from ts preprocessor');
});

skipIfBun('knip --preprocessor knip-preprocessor', () => {
  const { stdout } = exec('knip --preprocessor knip-preprocessor', { cwd });
  assert.equal(stdout, 'hi from pkg preprocessor');
});

skipIfBun('knip --preprocessor @org/preprocessor', () => {
  const { stdout } = exec('knip --preprocessor @org/preprocessor', { cwd });
  assert.equal(stdout, 'hi from scoped preprocessor');
});

skipIfBun(`knip --preprocessor with-args --preprocessor-options {"food":"cupcake"}`, () => {
  const { stdout } = exec(`knip --preprocessor with-args --preprocessor-options {"food":"cupcake"}`, { cwd });
  assert.equal(stdout, 'hi from with-args preprocessor, you gave me: cupcake');
});

test('knip --preprocessor {cwd}/index.js', () => {
  const { stdout } = exec(`knip --preprocessor ${cwd}/index.js`, { cwd });
  assert.equal(stdout, 'hi from js preprocessor');
});
