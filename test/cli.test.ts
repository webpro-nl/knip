import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import test from 'node:test';
import { helpText } from '../src/util/cli-arguments.js';
import { resolve } from '../src/util/path.js';
import { version } from '../src/version.js';

const cwd = resolve('fixtures/cli');

const exec = (command: string) => {
  const output = execSync(command.replace(/^knip/, 'node ../../dist/cli.js'), { cwd });
  return output.toString().trim();
};

test('knip --version', () => {
  assert.equal(exec('knip --version'), version);
});

test('knip --help', () => {
  assert.equal(exec('knip --help'), helpText);
});
