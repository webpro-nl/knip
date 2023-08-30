import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from '../src/util/path.js';

const cwd = resolve('fixtures/cli-preprocessor');

const exec = (command: string) => {
  const output = execSync(command.replace(/^knip/, 'node ../../dist/cli.js'), { cwd });
  return output.toString().trim();
};

test('knip --preprocessor ./index.js', () => {
  assert.equal(exec('knip --preprocessor ./index.js'), 'hi from js preprocessor');
});

test('knip --preprocessor ./index.ts', () => {
  assert.equal(exec('knip --preprocessor ./index.ts'), 'hi from ts preprocessor');
});

test('knip --preprocessor knip-preprocessor', () => {
  assert.equal(exec('knip --preprocessor knip-preprocessor'), 'hi from pkg preprocessor');
});

test('knip --preprocessor @org/preprocessor', () => {
  assert.equal(exec('knip --preprocessor @org/preprocessor'), 'hi from scoped preprocessor');
});
