import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toModule } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { isObject } from '../../util/validation.ts';

// https://www.electron.build/configuration
// https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.18.1/packages/app-builder-lib/src/util/config/load.ts
// https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.18.1/packages/app-builder-lib/src/configuration.ts
// https://github.com/electron-userland/electron-builder/blob/electron-builder%4026.18.1/packages/app-builder-lib/src/util/resolve.ts

const title = 'electron-builder';

const enablers = ['electron-builder'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'build';

const config = ['package.json', 'electron-builder.{yml,yaml,json,json5,toml,js,cjs,ts}'];

const hooks = [
  'beforePack',
  'afterExtract',
  'afterPack',
  'afterSign',
  'artifactBuildStarted',
  'artifactBuildCompleted',
  'afterAllArtifactBuild',
  'msiProjectCreated',
  'appxManifestCreated',
  'onNodeModuleFile',
  'beforeBuild',
];

type ElectronBuilderConfig = Record<string, unknown>;

type ConfigFactory = (request: Record<string, unknown>) => ElectronBuilderConfig | Promise<ElectronBuilderConfig>;

const resolveConfig: ResolveConfig<ElectronBuilderConfig | ConfigFactory> = async (config, options) => {
  // electron-builder calls a config factory with its read config request and awaits the result
  const request = {
    packageKey: 'build',
    configFilename: 'electron-builder',
    projectDir: options.cwd,
    packageMetadata: null,
  };
  const localConfig = typeof config === 'function' ? await config(request) : config;
  if (!isObject(localConfig)) return [];

  const ids: unknown[] = [];
  for (const hook of hooks) ids.push(localConfig[hook]);
  for (const target of [localConfig.mac, localConfig.mas, localConfig.masDev]) {
    if (isObject(target)) ids.push(target.sign);
  }
  const win = localConfig.win;
  if (isObject(win) && isObject(win.signtoolOptions)) ids.push(win.signtoolOptions.sign);

  const inputs: Input[] = [];
  for (const id of ids) if (typeof id === 'string') inputs.push(toModule(id, { dir: options.cwd }));
  return inputs;
};

const args = {
  config: true,
  args: (args: string[]) => args.filter(arg => !/^--?c(onfig)?\./.test(arg)),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
  args,
};

export default plugin;
