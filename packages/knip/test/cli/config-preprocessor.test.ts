import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/config-preprocessor');

test('knip with preprocessor in config', () => {
  const { stdout } = exec('knip', { cwd });
  assert.equal(stdout, 'hi from config preprocessor');
});

test('knip --strict with preprocessor in config', () => {
  const { stdout } = exec('knip --strict', { cwd });
  assert.equal(stdout, 'hi from config preprocessor');
});

test('knip --preprocessor overrides config preprocessor', () => {
  const { stdout } = exec('knip --preprocessor ./override.js', {
    cwd: resolve('fixtures/config-preprocessor-override'),
  });
  assert.equal(stdout, 'hi from override preprocessor');
});

test('knip with preprocessorOptions in config', () => {
  const { stdout } = exec('knip', { cwd: resolve('fixtures/config-preprocessor-options') });
  assert.equal(stdout, 'hi from config preprocessor, you gave me: cupcake');
});

test('knip with multiple preprocessors in config', () => {
  const { stdout } = exec('knip', { cwd: resolve('fixtures/config-preprocessor-chain') });
  assert.equal(stdout, 'hi from first then second preprocessor');
});
