import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../src/util/path.js';
import { execFactory } from '../helpers/exec.js';

const cwd = resolve('fixtures/cli');

const exec = execFactory(cwd);

test('knip --include files,dependencies', () => {
  const { stdout, status } = exec('knip --include files,dependencies');
  assert.equal(stdout, '');
  assert.equal(status, 0);
});

test('knip --include files --include dependencies', () => {
  const { stdout, status } = exec('knip --include files --include dependencies');
  assert.equal(stdout, '');
  assert.equal(status, 0);
});

test('knip --include file,dep', () => {
  const { stderr, status } = exec('knip --include file,dep');
  assert.match(stderr, /Invalid issue type: file/);
  assert.equal(status, 2);
});

test('knip --include files --include deps', () => {
  const { stderr, status } = exec('knip --include files,deps');
  assert.match(stderr, /Invalid issue type: deps/);
  assert.equal(status, 2);
});
