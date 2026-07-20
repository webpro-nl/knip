import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const skipIfBun = typeof Bun !== 'undefined' ? test.skip : test;

const cwd = resolve('fixtures/cli-preprocessor');
const configCwd = resolve('fixtures/cli-preprocessor-config');
const manifestConfigCwd = resolve('fixtures/cli-preprocessor-config/manifest-provenance');

const runConfig = (configFile: string, extraArgs?: string) =>
  exec(`knip -c ${configFile}${extraArgs ? ` ${extraArgs}` : ''}`, { cwd: configCwd });

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

test('loads a config-sourced JavaScript preprocessor relative to its config file', () => {
  const { status, stdout } = runConfig('knip-relative-javascript.json');
  assert.equal(status, 0);
  assert.equal(stdout, 'config JavaScript preprocessor');
});

test('resolves inherited package.json preprocessors from the supplying manifest', () => {
  const { status, stdout } = exec('knip -c config/knip.json', { cwd: manifestConfigCwd });
  assert.equal(status, 0);
  assert.equal(stdout, 'manifest preprocessor');
});

skipIfBun('loads a config-sourced package preprocessor relative to its config file', () => {
  const { status, stdout } = runConfig('knip-package.json');
  assert.equal(status, 0);
  assert.equal(stdout, 'config package preprocessor');
});

test('passes object-shaped config preprocessorOptions to the preprocessor', () => {
  const { status, stdout } = runConfig('knip-options.json');
  assert.equal(status, 0);
  assert.equal(stdout, 'config preprocessor food: cupcake');
});

test('runs config preprocessors from left to right, awaiting each one', () => {
  const { status, stdout } = runConfig('knip-async-chain.json');
  assert.equal(status, 0);
  assert.equal(stdout, 'start-async-sync');
});

test('command-line preprocessor overrides the configuration list', () => {
  const { status, stdout } = runConfig(
    'knip-cli-precedence.json',
    '--preprocessor ./cli-preprocessor.js --preprocessor-options cli-options'
  );
  assert.equal(status, 0);
  assert.equal(stdout, 'CLI preprocessor: cli-options');
});

test('keeps config-sourced absolute preprocessor paths absolute', () => {
  const { status, stdout } = runConfig('knip-absolute.ts');
  assert.equal(status, 0);
  assert.equal(stdout, 'config absolute preprocessor');
});

test('uses preprocessed configuration hints for the CLI exit code', () => {
  const withoutPreprocessor = runConfig('knip-hint-exit-code-unprocessed.json', '--treat-config-hints-as-errors');
  assert.equal(withoutPreprocessor.status, 1);
  assert.match(withoutPreprocessor.stderr, /unused-ignore/);

  const withPreprocessor = runConfig('knip-hint-exit-code.json', '--treat-config-hints-as-errors');
  assert.equal(withPreprocessor.status, 0);
  assert.equal(withPreprocessor.stdout, '');
  assert.equal(withPreprocessor.stderr, '');
});

test('errors when the config preprocessor fails to load', () => {
  const { status, stderr } = runConfig('knip-load-error.json');
  assert.equal(status, 2);
  assert.match(stderr, /ERROR: Error loading .*missing-preprocessor\.js/);
});

test('errors when a preprocessor returns undefined', () => {
  const { status, stderr } = runConfig('knip-undefined-return.json');
  assert.equal(status, 2);
  assert.match(stderr, /ERROR: Preprocessor contract violation: expected an object with an "issues" object/);
  assert.doesNotMatch(stderr, /TypeError|Cannot read properties/);
});
