import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import test from 'node:test';
import { helpText } from '../src/util/cli-arguments.js';
import { version } from '../src/version.js';

const exec = (command: string) => {
  const output = execSync(command.replace(/^knip/, 'node --no-warnings --loader tsx src/cli.ts'));
  return output.toString().trim();
};

test('knip --version', () => {
  assert.equal(exec('knip --version'), version);
});

test('knip --help', () => {
  assert.equal(exec('knip --help'), helpText);
});

test('knip', { skip: true }, () => {
  assert.equal(exec('knip'), '✂️  Excellent, Knip found no issues.');
});
