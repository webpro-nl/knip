import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { WorkspaceWorker } from '../../src/WorkspaceWorker.ts';
import { Plugins } from '../../src/plugins.ts';
import type { Plugin } from '../../src/types/config.ts';
import { toConfig } from '../../src/util/input.ts';
import { dirname, isAbsolute, join } from '../../src/util/path.ts';
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

test('Cached plugin config cycles terminate', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'knip-cache-cycle-'));
  const cacheLocation = mkdtempSync(join(tmpdir(), 'knip-cache-'));
  const original: Plugin = { ...Plugins.vitest };

  writeFileSync(join(cwd, 'package.json'), '{"name":"cache-cycle"}\n');
  writeFileSync(join(cwd, 'vitest.config.js'), 'export default {};\n');
  writeFileSync(join(cwd, 'linked.config.js'), 'export default {};\n');

  Object.assign(Plugins.vitest, {
    config: ['vitest.config.js'],
    resolveConfig: (_config, options) => [
      toConfig('vitest', options.configFileName === 'vitest.config.js' ? './linked.config.js' : './vitest.config.js', {
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
      pkgName: 'cache-cycle',
      dir: cwd,
      ancestors: [],
      config: createConfig(),
      manifestPath: join(cwd, 'package.json'),
      manifestStr: '{"name":"cache-cycle"}\n',
      ignoreMembers: [],
    };

    const worker = new WorkspaceWorker({
      name: '.',
      dir: cwd,
      config: createConfig(),
      manifest: { name: 'cache-cycle' },
      dependencies: new Set(),
      rootManifest: undefined,
      handleInput: input => {
        if (handleInputCalls++ >= maxHandleInputCalls) throw new Error('Cached config loop');
        if (!input.containingFilePath) return;
        return isAbsolute(input.specifier) ? input.specifier : join(dirname(input.containingFilePath), input.specifier);
      },
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
