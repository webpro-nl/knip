import assert from 'node:assert/strict';
import test from 'node:test';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/plugin-entry-dir');

const createWorker = async (
  negatedWorkspacePatterns: string[] = [],
  ignoredWorkspacePatterns: string[] = [],
  name = '.',
  pluginEntryNegatedWorkspacePatterns?: string[]
) =>
  new WorkspaceWorker({
    name,
    dir: cwd,
    config: {
      entry: [],
      project: [],
      paths: {},
      ignore: [],
      ignoreFiles: [],
      ignoreGlobalBinaries: true,
      ignoreExportsUsedInFile: false,
      isIncludeEntryExports: false,
    },
    manifest: {},
    dependencies: new Set(),
    rootManifest: undefined,
    handleInput: () => undefined,
    handleConfigLoadError: () => {},
    findWorkspaceByFilePath: () => undefined,
    getManifest: () => undefined,
    readRawFile: () => '',
    negatedWorkspacePatterns,
    pluginEntryNegatedWorkspacePatterns,
    ignoredWorkspacePatterns,
    enabledPluginsInAncestors: [],
    configFilesMap: new Map(),
    options: await createOptions({ cwd }),
  });

test('Keep recursive and scoped entries in one batch without workspace negations', async () => {
  const worker = await createWorker();
  const patterns = ['**/*.test.ts', 'tools/setup.ts', '!**/skip.test.ts'];
  assert.deepEqual(worker.getPluginEntryFilePatterns(patterns), [patterns]);
});

test('Keep entries in one batch when descendant workspaces need no negation', async () => {
  const worker = await createWorker([], [], 'packages/app');
  const patterns = ['**/*.test.ts', 'nested/setup.ts', '!nested/skip.ts'];
  assert.deepEqual(worker.getPluginEntryFilePatterns(patterns), [patterns]);
});

test('Split recursive entries from scoped entries with explicit negations in both', async () => {
  const worker = await createWorker(['!packages/app/**', '!packages/app/nested/**']);
  assert.deepEqual(
    worker.getPluginEntryFilePatterns(['**/*.test.ts', 'packages/app/check.ts', '!**/skip.test.ts', '!tools']),
    [
      [
        '**/*.test.ts',
        '!**/skip.test.ts',
        '!**/skip.test.ts/**',
        '!tools',
        '!tools/**',
        '!packages/app/**',
        '!packages/app/nested/**',
      ],
      ['packages/app/check.ts', '!**/skip.test.ts', '!**/skip.test.ts/**', '!tools', '!tools/**'],
    ]
  );
});

test('Keep recursive-only and scoped-only entries in one batch', async () => {
  const worker = await createWorker(['!packages/app/**']);
  assert.deepEqual(worker.getPluginEntryFilePatterns(['**/*.test.ts', '!skip.ts']), [
    ['**/*.test.ts', '!skip.ts', '!skip.ts/**', '!packages/app/**'],
  ]);
  assert.deepEqual(worker.getPluginEntryFilePatterns(['packages/app/check.ts', '!skip.ts']), [
    ['packages/app/check.ts', '!skip.ts', '!skip.ts/**'],
  ]);
});

test('Preserve empty and negative-only batches without workspace negations', async () => {
  const worker = await createWorker();
  assert.deepEqual(worker.getPluginEntryFilePatterns([]), [[]]);
  assert.deepEqual(worker.getPluginEntryFilePatterns(['!tools']), [['!tools']]);
});

test('Keep nested ignored workspace exclusions relative to their worker in both batches', async () => {
  const worker = await createWorker(['!nested/ignored/**'], ['packages/app/nested/ignored'], 'packages/app');
  assert.deepEqual(worker.getPluginEntryFilePatterns(['**/*.test.ts', 'nested/ignored/check.ts'], cwd), [
    ['**/*.test.ts', '!nested/ignored/**', '!nested/ignored', '!nested/ignored/**'],
    ['nested/ignored/check.ts', '!nested/ignored', '!nested/ignored/**'],
  ]);
});

test('Keep ignored workspace exclusions in the unsplit batch', async () => {
  const worker = await createWorker([], ['packages/ignored']);
  assert.deepEqual(worker.getPluginEntryFilePatterns(['**/*.test.ts', 'tools/setup.ts'], cwd), [
    ['**/*.test.ts', 'tools/setup.ts', '!packages/ignored', '!packages/ignored/**'],
  ]);
});

test('Preserve repeated explicit negations when splitting overlapping entries', async () => {
  const worker = await createWorker(['!packages/app/**']);
  assert.deepEqual(worker.getPluginEntryFilePatterns(['**/*.ts', 'tools/*.ts', '!tools/skip.ts', '!tools/skip.ts']), [
    ['**/*.ts', '!tools/skip.ts', '!tools/skip.ts/**', '!tools/skip.ts', '!tools/skip.ts/**', '!packages/app/**'],
    ['tools/*.ts', '!tools/skip.ts', '!tools/skip.ts/**', '!tools/skip.ts', '!tools/skip.ts/**'],
  ]);
});

test('Keep plugin entries in one batch when only general workspace ignores need negation', async () => {
  const negations = ['!packages/**', '!!packages/app/**'];
  const worker = await createWorker(negations, [], '.', []);
  const patterns = ['**/*.test.ts', 'packages/app/check.ts'];

  assert.deepEqual(worker.getPluginEntryFilePatterns(patterns), [patterns]);
  assert.deepEqual(worker.negatedWorkspacePatterns, negations);
});
