import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/cli-reporter');

const exec = execFactory(cwd);

test('knip --reporter ./index.js', () => {
  assert.equal(exec('knip --reporter ./index.js').stdout, 'hi from js reporter');
});

test('knip --reporter ./index.ts', () => {
  assert.equal(exec('knip --reporter ./index.ts').stdout, 'hi from ts reporter');
});

test('knip --reporter knip-reporter', () => {
  assert.equal(exec('knip --reporter knip-reporter').stdout, 'hi from pkg reporter');
});

test('knip --reporter @org/reporter', () => {
  assert.equal(exec('knip --reporter @org/reporter').stdout, 'hi from scoped reporter');
});
