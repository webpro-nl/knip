import assert from 'node:assert/strict';
import test from 'node:test';
import { helpText } from '../../src/util/cli-arguments.ts';
import { loadJSON } from '../../src/util/fs.ts';
import { version } from '../../src/version.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/cli');

test('knip --version', async () => {
  assert.equal(exec('knip --version', { cwd }).stdout, version);
  const contents = await loadJSON(resolve('package.json'));
  assert.equal(version, contents.version);
});

test('knip --help', () => {
  assert.equal(exec('knip --help', { cwd }).stdout, helpText);
});
