import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as npm from '../src/npm-scripts';

const cwd = path.resolve('test/fixtures/npm-scripts');

const rootConfig = {
  include: [],
  exclude: [],
  workspaces: {},
  ignoreBinaries: ['bash', 'rm'],
  ignoreFiles: [],
  ignoreWorkspaces: [],
};

const manifest = {
  scripts: {
    nodemon: 'nodemon index.js',
    build: 'rm -rf && dotenv -- nx build npm-scripts',
    pm2: 'NODE_ENV=production pm2 start index.js',
    dev: 'pm2-dev start index.js',
    lint: 'eslint',
    test: 'bash test/unit.sh && bash test/e2e.sh',
  },
  dependencies: { express: '*' },
  devDependencies: {
    pm2: '*',
    nx: '*',
    unused: '*',
    eslint: '8.28.0',
    'eslint-v6': 'npm:eslint@6.0.1',
    'eslint-v7': 'npm:eslint@7.0.0',
    'eslint-v8': 'npm:eslint@8.0.1',
  },
};

const expectedBinaries = new Map();
expectedBinaries.set('pm2', new Set(['pm2']));
expectedBinaries.set('pm2-dev', new Set(['pm2']));
expectedBinaries.set('pm2-docker', new Set(['pm2']));
expectedBinaries.set('pm2-runtime', new Set(['pm2']));
expectedBinaries.set('nx', new Set(['nx']));
expectedBinaries.set('unused', new Set(['unused']));
expectedBinaries.set('eslint', new Set(['eslint', 'eslint-v6', 'eslint-v7', 'eslint-v8']));

test('Referenced dependencies in npm scripts', async () => {
  const { dependencies, peerDependencies, installedBinaries } = await npm.findDependencies({
    rootConfig,
    manifest,
    isRoot: true,
    isProduction: false,
    isStrict: false,
    dir: cwd,
    cwd,
  });

  assert.deepEqual(dependencies, ['nodemon', 'dotenv', 'nx', 'pm2', 'eslint', 'eslint-v6', 'eslint-v7', 'eslint-v8']);

  assert.deepEqual(installedBinaries, expectedBinaries);

  const expectedPeerDependencies = new Map();
  expectedPeerDependencies.set('pm2-peer-dep', new Set(['pm2']));

  assert.deepEqual(peerDependencies, expectedPeerDependencies);
});

test('Referenced dependencies in npm scripts (strict)', async () => {
  const { dependencies, installedBinaries } = await npm.findDependencies({
    rootConfig,
    manifest,
    isRoot: true,
    isProduction: false,
    isStrict: true,
    dir: cwd,
    cwd,
  });

  assert.deepEqual(dependencies, ['nodemon', 'dotenv', 'nx', 'pm2', 'eslint']);

  assert.deepEqual(installedBinaries, expectedBinaries);
});
