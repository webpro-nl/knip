import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { ParcelConfig } from './types.ts';

// https://parceljs.org/plugin-system/configuration/

const title = 'Parcel';

const enablers = ['parcel', '@parcel/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.parcelrc'];

const resolveConfig: ResolveConfig<ParcelConfig> = async config => {
  const dependencies: string[] = [];

  if (typeof config.extends === 'string') {
    dependencies.push(config.extends);
  } else if (Array.isArray(config.extends)) {
    dependencies.push(...config.extends);
  }

  const extractPlugins = (plugins: string | string[] | undefined) => {
    if (!plugins) return [];
    return typeof plugins === 'string' ? [plugins] : plugins;
  };

  const extractPluginsFromMap = (pluginMap: Record<string, string | string[]> | undefined) => {
    if (!pluginMap) return [];
    return Object.values(pluginMap).flatMap(extractPlugins);
  };

  if (config.resolvers) dependencies.push(...extractPlugins(config.resolvers));
  if (config.transformers) dependencies.push(...extractPluginsFromMap(config.transformers));
  if (config.bundler) dependencies.push(config.bundler);
  if (config.namers) dependencies.push(...extractPlugins(config.namers));
  if (config.runtimes) dependencies.push(...extractPluginsFromMap(config.runtimes));
  if (config.packagers) dependencies.push(...extractPluginsFromMap(config.packagers));
  if (config.optimizers) dependencies.push(...extractPluginsFromMap(config.optimizers));
  if (config.compressors) dependencies.push(...extractPluginsFromMap(config.compressors));
  if (config.reporters) dependencies.push(...extractPlugins(config.reporters));
  if (config.validators) dependencies.push(...extractPluginsFromMap(config.validators));

  return dependencies.map(id => toDeferResolve(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
