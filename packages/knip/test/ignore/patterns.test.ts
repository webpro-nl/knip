import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { exec } from '../helpers/exec.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Configuration hints for unused ignore patterns', async () => {
  const cwd = resolve('fixtures/ignore/patterns');
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'ignore', identifier: 'dist/**', workspaceName: undefined, reason: 'gitignored' },
    { type: 'ignore', identifier: 'generated/**', workspaceName: undefined, reason: 'no-matches' },
    { type: 'ignore', identifier: 'lib/**', workspaceName: undefined, reason: 'no-issues' },
    { type: 'ignoreFiles', identifier: 'temp/**', workspaceName: undefined, reason: 'no-matches' },
    { type: 'ignoreFiles', identifier: 'lib/used.ts', workspaceName: undefined, reason: 'no-issues' },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 3,
  });
});

test('Configuration hints for unused ignore patterns (monorepo)', async () => {
  const cwd = resolve('fixtures/ignore/patterns-monorepo');
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'ignoreDependencies', identifier: 'root-dep', workspaceName: '.', configKey: '.' },
    { type: 'ignoreDependencies', identifier: 'top-level-dep', workspaceName: '.' },
    { type: 'ignoreBinaries', identifier: 'root-dep', workspaceName: '.' },
    { type: 'ignoreUnresolved', identifier: /^virtual:/, workspaceName: '.', configKey: '.' },
    { type: 'ignore', identifier: 'build/**', workspaceName: undefined, reason: 'no-matches' },
    { type: 'ignore', identifier: 'tmp/**', workspaceName: '.', configKey: '.', reason: 'no-matches' },
    {
      type: 'ignore',
      identifier: 'cache/**',
      workspaceName: 'packages/app',
      configKey: 'packages/*',
      reason: 'no-matches',
    },
    {
      type: 'ignore',
      identifier: '../shared/**',
      workspaceName: 'packages/app',
      configKey: 'packages/*',
      reason: 'no-matches',
    },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 4,
  });
});

test('Configuration hints for unused ignore patterns (output)', () => {
  const cwd = resolve('fixtures/ignore/patterns');
  const lines = exec('knip', { cwd })
    .stderr.split('\n')
    .map(line => line.trimEnd());
  assert.deepEqual(lines, [
    'Configuration hints (5)',
    'dist/**       Remove from knip.json → ignore (gitignored)',
    'generated/**  Remove from knip.json → ignore (no matches)',
    'lib/**        Remove from knip.json → ignore (no issues)',
    'temp/**       Remove from knip.json → ignoreFiles (no matches)',
    'lib/used.ts   Remove from knip.json → ignoreFiles (files are used)',
  ]);
});

test('Configuration hints for unused ignore patterns (output, monorepo)', () => {
  const cwd = resolve('fixtures/ignore/patterns-monorepo');
  const lines = exec('knip', { cwd })
    .stderr.split('\n')
    .map(line => line.trimEnd());
  assert.deepEqual(lines, [
    'Configuration hints (8)',
    'build/**       Remove from knip.json → ignore (no matches)',
    'tmp/**         Remove from knip.json → (root) → ignore (no matches)',
    'cache/**       Remove from knip.json → packages/* → ignore (no matches)',
    '../shared/**   Remove from knip.json → packages/* → ignore (no matches)',
    'root-dep       Remove from knip.json → (root) → ignoreDependencies',
    'top-level-dep  Remove from knip.json → ignoreDependencies',
    'root-dep       Remove from knip.json → ignoreBinaries',
    '^virtual:      Remove from knip.json → (root) → ignoreUnresolved',
  ]);
});
