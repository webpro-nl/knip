import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const skipIfBun = typeof Bun !== 'undefined' ? test.skip : test;

const cwd = resolve('fixtures/cli-reporter');

test('knip --reporter ./index.js', () => {
  assert.equal(exec('knip --reporter ./index.js', { cwd }).stdout, 'hi from js reporter');
});

test('knip --reporter ./index.ts', () => {
  assert.equal(exec('knip --reporter ./index.ts', { cwd }).stdout, 'hi from ts reporter');
});

skipIfBun('knip --reporter knip-reporter', () => {
  assert.equal(exec('knip --reporter knip-reporter', { cwd }).stdout, 'hi from pkg reporter');
});

skipIfBun('knip --reporter @org/reporter', () => {
  assert.equal(exec('knip --reporter @org/reporter', { cwd }).stdout, 'hi from scoped reporter');
});

test('knip --reporter {cwd}/index.js', () => {
  assert.equal(exec(`knip --reporter ${cwd}/index.js`, { cwd }).stdout, 'hi from js reporter');
});
