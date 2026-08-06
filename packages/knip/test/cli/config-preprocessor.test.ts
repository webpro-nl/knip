import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/config-preprocessor');

test('knip with preprocessor in config', () => {
  const { stdout } = exec('knip', { cwd });
  assert.equal(stdout, 'hi from config preprocessor');
});

test('knip --preprocessor overrides config preprocessor', () => {
  const { stdout } = exec('knip --preprocessor ./preprocessor-with-options.js', { cwd });
  assert.equal(stdout, 'hi from config preprocessor with options: undefined');
});

const cwdWithOptions = resolve('fixtures/config-preprocessor-options');

test('knip with preprocessor and preprocessorOptions in config', () => {
  const { stdout } = exec('knip', { cwd: cwdWithOptions });
  assert.equal(stdout, 'hi from config preprocessor with options: cupcake');
});
