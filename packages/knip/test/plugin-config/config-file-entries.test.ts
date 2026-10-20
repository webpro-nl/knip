import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/husky-v9');

test('Read git hooks without adding them as entry files', async () => {
  const options = await createOptions({ cwd });
  const manifest = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
  const worker = new WorkspaceWorker({
    name: '.',
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
    manifest,
    dependencies: new Set(Object.keys(manifest.devDependencies)),
    rootManifest: manifest,
    handleInput: () => undefined,
    handleConfigLoadError: () => {},
    findWorkspaceByFilePath: () => undefined,
    getManifest: () => undefined,
    readRawFile: filePath => readFileSync(filePath, 'utf8'),
    negatedWorkspacePatterns: [],
    ignoredWorkspacePatterns: [],
    enabledPluginsInAncestors: [],
    configFilesMap: new Map(),
    options,
  });
  await worker.init();

  const inputs = await worker.runPlugins();

  const hooks = join(cwd, '.husky');
  assert(inputs.some(input => input.specifier === 'eslint' && input.containingFilePath === join(hooks, 'pre-rebase')));
  assert.deepEqual(
    inputs.filter(input => input.type === 'entry' && input.specifier.startsWith(hooks)),
    []
  );
});
