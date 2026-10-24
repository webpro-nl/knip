import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toDependency, toProductionEntry } from '../../util/input.ts';
import { toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { findWebpackDependenciesFromConfig } from '../webpack/index.ts';

// https://www.electronforge.io/config/configuration
// https://github.com/electron/forge/blob/v8.0.1/packages/api/core/src/util/forge-config.ts
// https://github.com/electron/forge/blob/v8.0.1/packages/plugin/vite/src/Config.ts
// https://github.com/electron/forge/blob/v8.0.1/packages/plugin/webpack/src/Config.ts

const title = 'Electron Forge';

const enablers = ['@electron-forge/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'config.forge';

const config = ['package.json', 'forge.config.{js,mjs,cjs,ts,mts,cts}'];

type Value = Record<string, unknown>;

const isObject = (value: unknown): value is Value =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// `new VitePlugin(…)`, `new MakerZIP(…)` etc. are class instances, while `{ name, config }` entries are plain objects
const isPlainObject = (value: unknown): value is Value =>
  isObject(value) && Object.getPrototypeOf(value) === Object.prototype;

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

const toStrings = (value: unknown): string[] => {
  const values: string[] = [];
  for (const item of isObject(value) ? Object.values(value) : toArray(value)) {
    if (typeof item === 'string') values.push(item);
  }
  return values;
};

const getPluginInputs = async (name: unknown, opts: unknown, options: PluginOptions): Promise<Input[]> => {
  if (!isObject(opts)) return [];
  const { cwd, configFilePath } = options;
  const inputs: Input[] = [];
  const addEntry = (value: unknown) => {
    for (const id of toStrings(value)) inputs.push(toProductionEntry(toAbsolute(id, cwd)));
  };
  const addConfig = async (pluginName: 'vite' | 'webpack', value: unknown) => {
    if (typeof value === 'string') {
      inputs.push(toConfig(pluginName, value, { dir: cwd, containingFilePath: configFilePath }));
    } else if (pluginName === 'webpack' && isObject(value)) {
      for (const input of await findWebpackDependenciesFromConfig(value, options)) inputs.push(input);
    }
  };

  if (name === 'vite' || name === '@electron-forge/plugin-vite') {
    for (const build of toArray(opts.build)) {
      if (!isObject(build)) continue;
      addEntry(build.entry);
      await addConfig('vite', build.config);
    }
    for (const renderer of toArray(opts.renderer)) if (isObject(renderer)) await addConfig('vite', renderer.config);
  } else if (name === 'webpack' || name === '@electron-forge/plugin-webpack') {
    await addConfig('webpack', opts.mainConfig);
    for (const renderer of toArray(opts.renderer)) {
      if (!isObject(renderer)) continue;
      await addConfig('webpack', renderer.config);
      for (const entryPoint of toArray(renderer.entryPoints)) {
        if (!isObject(entryPoint)) continue;
        addEntry(entryPoint.js);
        if (!isObject(entryPoint.preload)) continue;
        addEntry(entryPoint.preload.js);
        await addConfig('webpack', entryPoint.preload.config);
      }
    }
  }

  return inputs;
};

const resolveConfig: ResolveConfig<unknown> = async (localConfig, options) => {
  if (typeof localConfig === 'string') {
    return [toConfig('electron-forge', localConfig, { containingFilePath: options.configFilePath })];
  }
  if (!isObject(localConfig)) return [];
  const inputs: Input[] = [];
  for (const item of [localConfig.makers, localConfig.publishers, localConfig.plugins].flatMap(toArray)) {
    if (!isObject(item)) continue;
    if (isPlainObject(item) && typeof item.name === 'string') inputs.push(toDependency(item.name));
    for (const input of await getPluginInputs(item.name, item.config, options)) inputs.push(input);
  }
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;
