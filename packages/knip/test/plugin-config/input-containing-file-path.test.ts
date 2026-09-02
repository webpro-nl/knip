import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import { Plugins } from '../../src/plugins.ts';
import { toDependency } from '../../src/util/input.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';

const createConfig = () => ({
  entry: [],
  project: [],
  paths: {},
  ignore: [],
  ignoreFiles: [],
  ignoreExportsUsedInFile: false,
  isIncludeEntryExports: false,
  vitest: true,
});

test('Plugin inputs retain their explicit containing file path', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'knip-input-containing-file-path-'));
  const manifestStr = '{"name":"input-containing-file-path","scripts":{"test":"vitest"}}\n';
  const manifest = { name: 'input-containing-file-path', scripts: { test: 'vitest' } };
  const resolveSource = join(cwd, 'resolve-source.config');
  const argsSource = join(cwd, 'args-source.config');
  const originalResolve = Plugins.vitest.resolve;
  const originalResolveInputs = Plugins.vitest.args?.resolveInputs;

  writeFileSync(join(cwd, 'package.json'), manifestStr);

  if (!Plugins.vitest.args) throw new Error('Expected Vitest arguments');
  Plugins.vitest.resolve = () => [toDependency('resolve-input', { containingFilePath: resolveSource })];
  Plugins.vitest.args.resolveInputs = () => [toDependency('args-input', { containingFilePath: argsSource })];

  try {
    const options = await createOptions({ cwd });
    const workspace = {
      name: '.',
      pkgName: manifest.name,
      dir: cwd,
      ancestors: [],
      config: createConfig(),
      manifestPath: join(cwd, 'package.json'),
      manifestStr,
      ignoreMembers: [],
    };
    const worker = new WorkspaceWorker({
      name: '.',
      dir: cwd,
      config: createConfig(),
      manifest,
      dependencies: new Set(),
      rootManifest: undefined,
      handleInput: () => undefined,
      findWorkspaceByFilePath: filePath => (filePath.startsWith(cwd) ? workspace : undefined),
      readFile: filePath => readFileSync(filePath, 'utf8'),
      negatedWorkspacePatterns: [],
      ignoredWorkspacePatterns: [],
      enabledPluginsInAncestors: [],
      configFilesMap: new Map(),
      options,
    });

    worker.enabledPlugins = ['vitest'];
    worker.enabledPluginsMap.vitest = true;

    const inputs = await worker.runPlugins();
    assert.equal(inputs.find(input => input.specifier === 'resolve-input')?.containingFilePath, resolveSource);
    assert.equal(inputs.find(input => input.specifier === 'args-input')?.containingFilePath, argsSource);
  } finally {
    Plugins.vitest.resolve = originalResolve;
    Plugins.vitest.args.resolveInputs = originalResolveInputs;
    rmSync(cwd, { recursive: true, force: true });
  }
});
