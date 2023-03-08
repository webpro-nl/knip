import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import * as npm from '../src/manifest/index.js';
import { getManifest } from './helpers/index.js';

const cwd = path.resolve('tests/fixtures/npm-scripts');
const manifest = getManifest(cwd);

test('Referenced dependencies in npm scripts', async () => {
  const config = {
    config: {
      include: [],
      exclude: [],
      workspaces: {},
      ignore: [],
      ignoreBinaries: ['bash', 'rm'],
      ignoreDependencies: [],
      ignoreWorkspaces: [],
    },
    manifest,
    isRoot: true,
    isProduction: false,
    isStrict: false,
    dir: cwd,
    cwd,
  };

  const { dependencies, peerDependencies, installedBinaries } = await npm.findDependencies(config);

  assert.deepEqual(dependencies, ['nodemon', 'dotenv', 'nx', 'pm2', 'eslint']);

  const expectedPeerDependencies = new Map();
  expectedPeerDependencies.set('pm2-peer-dep', new Set(['pm2']));

  assert.deepEqual(peerDependencies, expectedPeerDependencies);

  const expectedBinaries = new Map();
  expectedBinaries.set('pm2', new Set(['pm2']));
  expectedBinaries.set('pm2-dev', new Set(['pm2']));
  expectedBinaries.set('pm2-docker', new Set(['pm2']));
  expectedBinaries.set('pm2-runtime', new Set(['pm2']));
  expectedBinaries.set('nx', new Set(['nx']));
  expectedBinaries.set('unused', new Set(['unused']));
  expectedBinaries.set('eslint', new Set(['eslint', 'eslint-v6', 'eslint-v7', 'eslint-v8']));

  assert.deepEqual(installedBinaries, expectedBinaries);
});
