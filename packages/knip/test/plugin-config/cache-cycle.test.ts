import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import { Plugins } from '../../src/plugins.ts';
import type { Plugin } from '../../src/types/config.ts';
import { toConfig } from '../../src/util/input.ts';
import { dirname, isAbsolute, join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';

const createConfig = () => ({
  entry: [],
  project: [],
  paths: {},
  ignore: [],
  ignoreFiles: [],
  ignoreGlobalBinaries: true,
  ignoreExportsUsedInFile: false,
  isIncludeEntryExports: false,
  isIncludeSubpathExports: false,
  vitest: true,
});

test('Cached plugin config cycles terminate', async () => {
  const cwd = await copyFixture('fixtures/plugin-config/basic');
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const original: Plugin = { ...Plugins.vitest };

  copyFileSync(join(cwd, 'vitest.config.ts'), join(cwd, 'linked.config.ts'));

  Object.assign(Plugins.vitest, {
    config: ['vitest.config.ts'],
    resolveConfig: (_config, options) => [
      toConfig('vitest', options.configFileName === 'vitest.config.ts' ? './linked.config.ts' : './vitest.config.ts', {
        containingFilePath: options.configFilePath,
      }),
    ],
    resolve: options => [toConfig('vitest', './missing.config.js', { containingFilePath: options.configFilePath })],
  } satisfies Partial<Plugin>);

  const createWorker = async (maxHandleInputCalls = Number.POSITIVE_INFINITY) => {
    const options = await createOptions({ cwd, args: { cache: true, 'cache-location': cacheLocation } });
    let handleInputCalls = 0;
    const workspace = {
      name: '.',
      pkgName: '@fixtures/plugin-config',
      dir: cwd,
      ancestors: [],
      aliases: new Map(),
      configKey: undefined,
      config: createConfig(),
      manifestPath: join(cwd, 'package.json'),
      manifestStr: readFileSync(join(cwd, 'package.json'), 'utf8'),
      ignoreMembers: [],
    };

    const worker = new WorkspaceWorker({
      name: '.',
      dir: cwd,
      config: createConfig(),
      manifest: { name: '@fixtures/plugin-config' },
      dependencies: new Set(),
      allDependencies: new Set(),
      rootManifest: undefined,
      handleInput: input => {
        if (handleInputCalls++ >= maxHandleInputCalls) throw new Error('Cached config loop');
        if (!input.containingFilePath) return;
        return isAbsolute(input.specifier) ? input.specifier : join(dirname(input.containingFilePath), input.specifier);
      },
      handleConfigLoadError: () => assert.fail('Unexpected plugin config load error'),
      findWorkspaceByFilePath: filePath => (filePath.startsWith(cwd) ? workspace : undefined),
      getManifest: () => undefined,
      readRawFile: filePath => readFileSync(filePath, 'utf8'),
      negatedWorkspacePatterns: [],
      ignoredWorkspacePatterns: [],
      enabledPluginsInAncestors: [],
      configFilesMap: new Map(),
      options,
    });

    worker.enabledPlugins = ['vitest'];
    worker.enabledPluginsMap.vitest = true;
    return worker;
  };

  try {
    const cold = await createWorker();
    await cold.runPlugins();
    cold.onDispose();

    const warm = await createWorker(10);
    await assert.doesNotReject(warm.runPlugins());
  } finally {
    Object.assign(Plugins.vitest, original);
    rmSync(cwd, { recursive: true, force: true });
    rmSync(cacheLocation, { recursive: true, force: true });
  }
});
