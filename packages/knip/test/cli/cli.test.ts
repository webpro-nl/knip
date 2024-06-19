import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { helpText } from '../../src/util/cli-arguments.js';
import { loadJSON } from '../../src/util/fs.js';
import { resolve } from '../../src/util/path.js';
import { version } from '../../src/version.js';
import { execFactory } from '../helpers/exec.js';

const cwd = resolve('fixtures/cli');

const exec = execFactory(cwd);

test('knip --version', async () => {
  assert.equal(exec('knip --version').stdout, version);

  const contents = await loadJSON(resolve('package.json'));
  assert.equal(version, contents.version);
});

test('knip --help', () => {
  assert.equal(exec('knip --help').stdout, helpText);
});
