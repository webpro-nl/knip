import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { arrayify } from '../../util/array.ts';
import { toDependency, toProductionEntry } from '../../util/input.ts';
import { isInternal, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { EsbuildConfig, PluginConfig } from './types.ts';

// https://www.serverless.com/framework/docs

const title = 'Serverless Framework';

const enablers = ['serverless'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['serverless.{js,cjs,mjs,ts,cts,mts,yml,yaml}'];

const handlerToEntry = (handler: string) => {
  const dot = handler.lastIndexOf('.');
  return toProductionEntry(`${handler.slice(0, dot)}.{js,ts}`);
};

const pluginToInput = (plugin: string, dir: string) =>
  isInternal(plugin) ? toProductionEntry(join(dir, plugin)) : toDependency(plugin);

const getInjectEntries = (esbuild: EsbuildConfig | undefined, dir: string) =>
  esbuild && typeof esbuild === 'object' ? arrayify(esbuild.inject).map(id => toProductionEntry(join(dir, id))) : [];

const resolveConfig: ResolveConfig<PluginConfig> = async (config, options) => {
  const functions = config.functions
    ? Object.values(config.functions).flatMap(fn => (fn.handler ? [handlerToEntry(fn.handler)] : []))
    : [];
  const plugins = config.plugins?.filter((plugin): plugin is string => typeof plugin === 'string') ?? [];
  const esbuild = config.custom?.esbuild || config.build?.esbuild ? [toDependency('esbuild', { optional: true })] : [];
  const injectEntries = [
    ...getInjectEntries(config.custom?.esbuild, options.configFileDir),
    ...getInjectEntries(config.build?.esbuild, options.configFileDir),
  ];

  return [
    ...functions,
    ...plugins.map(plugin => pluginToInput(plugin, options.configFileDir)),
    ...esbuild,
    ...injectEntries,
  ];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
