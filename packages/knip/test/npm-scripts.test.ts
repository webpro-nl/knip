import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { getDependencyMetaData } from '../src/manifest/index.js';
import { join, resolve } from '../src/util/path.js';
import { load } from '../src/util/plugin.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/npm-scripts');
const manifest = await load(join(cwd, 'package.json'));

test('Get metadata from dependencies (getDependencyMetaData)', async () => {
  const config = {
    dir: cwd,
    cwd,
    packageNames: [...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.devDependencies ?? {})],
  };

  const { hostDependencies, installedBinaries } = await getDependencyMetaData(config);

  const expectedHostDependencies = new Map();
  expectedHostDependencies.set('pm2-peer-dep', [{ name: 'pm2', isPeerOptional: false }]);

  assert.deepEqual(hostDependencies, expectedHostDependencies);

  assert.deepEqual(
    installedBinaries,
    new Map([
      ['pm2', new Set(['pm2', 'pm2-dev', 'pm2-docker', 'pm2-runtime'])],
      ['pm2-dev', new Set(['pm2'])],
      ['pm2-docker', new Set(['pm2'])],
      ['pm2-runtime', new Set(['pm2'])],
      ['runnable', new Set(['@org/runnable'])],
      ['nx', new Set(['nx'])],
      ['package', new Set(['package-cli'])],
      ['package-cli', new Set(['package'])],
      ['unused', new Set(['unused'])],
      ['eslint', new Set(['eslint', 'eslint-v6', 'eslint-v7', 'eslint-v8'])],
      ['eslint-v6', new Set(['eslint'])],
      ['eslint-v7', new Set(['eslint'])],
      ['eslint-v8', new Set(['eslint'])],
      ['@commitlint/cli', new Set(['commitlint'])],
      ['@org/runnable', new Set(['runnable'])],
      ['commitlint', new Set(['@commitlint/cli'])],
    ])
  );
});

test('Unused dependencies in npm scripts', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['express']);

  assert(issues.devDependencies['package.json']['unused']);
  assert(!issues.devDependencies['package.json']['eslint-v6']);
  assert(!issues.devDependencies['package.json']['eslint-v7']);
  assert(!issues.devDependencies['package.json']['eslint-v8']);

  assert(issues.binaries['package.json']['nodemon']);
  assert(issues.binaries['package.json']['dotenv']);
  assert(!issues.binaries['package.json']['rm']);
  assert(!issues.binaries['package.json']['bash']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    devDependencies: 1,
    binaries: 2,
    processed: 1,
    total: 2,
  });

  assert.deepEqual(
    configurationHints,
    new Set([
      { workspaceName: '.', identifier: 'rm', type: 'ignoreBinaries' },
      { workspaceName: '.', identifier: 'bash', type: 'ignoreBinaries' },
      { workspaceName: '.', identifier: 'eslint', type: 'ignoreBinaries' },
    ])
  );
});

test('Unused dependencies in npm scripts (strict)', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert(issues.dependencies['package.json']['express']);
  assert(issues.dependencies['package.json']['unused-peer-dep']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 2,
    processed: 1,
    total: 2,
  });

  assert.deepEqual(
    configurationHints,
    new Set([
      { workspaceName: '.', identifier: 'rm', type: 'ignoreBinaries' },
      { workspaceName: '.', identifier: 'bash', type: 'ignoreBinaries' },
    ])
  );
});
