import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

test('Support loading js async function for configuration', async () => {
  const cwd = resolve('fixtures/config-js-async');
  assert.equal(exec('knip', { cwd }).stdout, '');
});

test('Support loading js object files for configuration', async () => {
  const cwd = resolve('fixtures/config-js-flat');
  assert.equal(exec('knip', { cwd }).stdout, '');
});

test('Support loading json files for configuration', async () => {
  const cwd = resolve('fixtures/config-json');
  assert.equal(exec('knip', { cwd }).stdout, '');
});

test('Support loading mjs async function files for configuration', async () => {
  const cwd = resolve('fixtures/config-mjs-async');
  assert.equal(exec('knip -c knip.mjs', { cwd }).stdout, '');
});

test('Support loading package.json for configuration', async () => {
  const cwd = resolve('fixtures/config-package-json');
  assert.equal(exec('knip', { cwd }).stdout, '');
});

test('Support loading ts async function for configuration', async () => {
  const cwd = resolve('fixtures/config-ts-async');
  assert.equal(exec('knip', { cwd }).stdout, '');
});

test('Support loading ts object files for configuration', async () => {
  const cwd = resolve('fixtures/config-ts-flat');
  assert.equal(exec('knip', { cwd }).stdout, '');
});

test('Support loading ts function for configuration', async () => {
  const cwd = resolve('fixtures/config-ts-function');
  assert.equal(exec('knip', { cwd }).stdout, '');
});

test('Support loading yaml files for configuration', async () => {
  const cwd = resolve('fixtures/config-yaml');
  assert.equal(exec('knip -c knip.yaml', { cwd }).stdout, '');
});
