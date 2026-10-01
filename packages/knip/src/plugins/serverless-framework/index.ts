import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { arrayify } from '../../util/array.ts';
import { toDependency, toProductionEntry } from '../../util/input.ts';
import { _load } from '../../util/loader.ts';
import { get } from '../../util/object.ts';
import { isInternal, join, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { EsbuildConfig, PluginConfig } from './types.ts';

// https://www.serverless.com/framework/docs

const title = 'Serverless Framework';

const enablers = ['serverless'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['serverless.{js,cjs,mjs,ts,cts,mts,yml,yaml}'];

const fileVariable = /^\$\{file\(([^()$]+)\)(?::([^\s,}]+))?/;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const resolveFileVariable = async (value: unknown, dir: string): Promise<unknown> => {
  const match = typeof value === 'string' && value.match(fileVariable);
  if (!match) return value;
  try {
    const content = await _load(toAbsolute(match[1].trim(), dir));
    return match[2] ? get(content, match[2]) : content;
  } catch {
    return undefined;
  }
};

const handlerToEntry = (handler: string) => {
  const dot = handler.lastIndexOf('.');
  return toProductionEntry(`${handler.slice(0, dot)}.{js,ts}`);
};

const pluginToInput = (plugin: string, dir: string) =>
  isInternal(plugin) ? toProductionEntry(join(dir, plugin)) : toDependency(plugin);

const getFunctionEntries = async (functions: unknown, dir: string) => {
  const entries = [];
  const resolved = await resolveFileVariable(functions, dir);
  for (const group of Array.isArray(resolved) ? resolved : [resolved]) {
    const fns = await resolveFileVariable(group, dir);
    if (!isRecord(fns)) continue;
    for (const name in fns) {
      const fn = await resolveFileVariable(fns[name], dir);
      if (isRecord(fn) && typeof fn.handler === 'string') entries.push(handlerToEntry(fn.handler));
    }
  }
  return entries;
};

const getInjectEntries = (esbuild: EsbuildConfig | undefined, dir: string) =>
  esbuild && typeof esbuild === 'object' ? arrayify(esbuild.inject).map(id => toProductionEntry(join(dir, id))) : [];

const resolveConfig: ResolveConfig<PluginConfig> = async (config, options) => {
  const functions = await getFunctionEntries(config.functions, options.configFileDir);
  const resolvedPlugins = await resolveFileVariable(config.plugins, options.configFileDir);
  const plugins = Array.isArray(resolvedPlugins)
    ? resolvedPlugins.filter((plugin): plugin is string => typeof plugin === 'string')
    : [];
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
