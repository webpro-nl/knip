import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const skipIfBun = typeof Bun !== 'undefined' ? test.skip : test;

const run = (fixture: string, command = 'knip -c config/knip.json') =>
  exec(command, { cwd: resolve(`fixtures/cli-preprocessor-config/${fixture}`) });

test('loads a config-sourced JavaScript preprocessor relative to its config file', () => {
  const { status, stdout } = run('relative-javascript');
  assert.equal(status, 0);
  assert.equal(stdout, 'config JavaScript preprocessor');
});

test('loads a config-sourced TypeScript preprocessor relative to its config file', () => {
  const { status, stdout } = run('relative-typescript');
  assert.equal(status, 0);
  assert.equal(stdout, 'config TypeScript preprocessor');
});

test('resolves inherited package.json preprocessors from the supplying manifest', () => {
  const { status, stdout } = run('manifest-provenance');
  assert.equal(status, 0);
  assert.equal(stdout, 'manifest preprocessor');
});

skipIfBun('loads a config-sourced package preprocessor relative to its config file', () => {
  const { status, stdout } = run('package');
  assert.equal(status, 0);
  assert.equal(stdout, 'config package preprocessor');
});

skipIfBun('loads a config-sourced scoped package preprocessor relative to its config file', () => {
  const { status, stdout } = run('scoped-package');
  assert.equal(status, 0);
  assert.equal(stdout, 'config scoped package preprocessor');
});

test('passes config-sourced preprocessorOptions to the preprocessor', () => {
  const { status, stdout } = run('options');
  assert.equal(status, 0);
  assert.equal(stdout, 'config preprocessor food: cupcake');
});

test('runs a config preprocessor array from left to right', () => {
  const { status, stdout } = run('repeated');
  assert.equal(status, 0);
  assert.equal(stdout, 'start-first-second');
});

test('awaits each config preprocessor before running the next', () => {
  const { status, stdout } = run('async-chain');
  assert.equal(status, 0);
  assert.equal(stdout, 'start-async-sync');
});

test('CLI preprocessor options wholesale-override config preprocessors', () => {
  const { status, stdout } = run(
    'cli-precedence',
    'knip -c config/knip.json --preprocessor ./cli-preprocessor.js --preprocessor-options cli-options'
  );
  assert.equal(status, 0);
  assert.equal(stdout, 'CLI preprocessor: cli-options');
});

test('keeps config-sourced absolute preprocessor paths absolute', () => {
  const { status, stdout } = run('absolute', 'knip');
  assert.equal(status, 0);
  assert.equal(stdout, 'config absolute preprocessor');
});

test('accepts an empty config preprocessor array', () => {
  const { status, stdout, stderr } = run('empty-array');
  assert.equal(status, 0);
  assert.equal(stdout, '');
  assert.equal(stderr, '');
});

test('uses preprocessed configuration hints for the CLI exit code', () => {
  const withoutPreprocessor = run(
    'hint-exit-code',
    'knip -c config/knip-without-preprocessor.json --treat-config-hints-as-errors'
  );
  assert.equal(withoutPreprocessor.status, 1);
  assert.match(withoutPreprocessor.stderr, /unused-ignore/);

  const withPreprocessor = run('hint-exit-code', 'knip -c config/knip.json --treat-config-hints-as-errors');
  assert.equal(withPreprocessor.status, 0);
  assert.equal(withPreprocessor.stdout, '');
  assert.equal(withPreprocessor.stderr, '');
});

test('fails loudly when a config-sourced preprocessor cannot load in the CLI', () => {
  const { status, stderr } = run('load-error');
  assert.equal(status, 2);
  assert.match(stderr, /ERROR: Error loading .*missing-preprocessor\.js/);
});

test('fails loudly when a CLI preprocessor returns an invalid result', () => {
  const { status, stderr } = run('undefined-return');
  assert.equal(status, 2);
  assert.match(stderr, /ERROR: Preprocessor contract violation: expected an object with an "issues" object/);
  assert.doesNotMatch(stderr, /TypeError|Cannot read properties/);
});
