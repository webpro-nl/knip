import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';
import { tsc } from '../helpers/tsc.ts';

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

test('Configuration types accept explicit undefined with exactOptionalPropertyTypes', () => {
  const cwd = resolve('fixtures/config-ts-flat');
  const output = tsc(cwd).stdout.toString();
  assert.deepEqual(
    output.split('\n').filter(line => line.startsWith('knip.config.ts(')),
    []
  );
});

test('Support loading ts function for configuration', async () => {
  const cwd = resolve('fixtures/config-ts-function');
  assert.equal(exec('knip', { cwd }).stdout, '');
});

test('Report configuration that is not an object', async () => {
  const cwd = resolve('fixtures/config-ts-nested-function');
  const { stderr, status } = exec('knip', { cwd });
  assert.match(stderr, /Expected an object as configuration/);
  assert.equal(status, 2);
});

test('Support loading yaml files for configuration', async () => {
  const cwd = resolve('fixtures/config-yaml');
  assert.equal(exec('knip -c knip.yaml', { cwd }).stdout, '');
});

test('Report configuration validation errors with locations and exit code 2', async () => {
  const cwd = await copyFixture('fixtures/config-json');
  try {
    await writeFile(
      join(cwd, 'knip.json'),
      JSON.stringify({
        ignoreGlobalBinaries: 'yes',
        workspaces: { app: { paths: { '@app': [42] } } },
        typo: true,
      })
    );
    const { stdout, stderr, status } = exec('knip', { cwd });
    assert.equal(status, 2);
    assert.equal(stdout, '');
    assert.equal(
      stderr,
      [
        'ERROR: Invalid input (location: ignoreGlobalBinaries, expected: boolean)',
        'ERROR: Invalid input (location: workspaces.app.paths.@app.0, expected: string)',
        'ERROR: Invalid input (unrecognized_keys: typo)',
      ].join('\n')
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
