import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDeferResolve, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://heyapi.dev/openapi-ts/get-started

const title = 'Hey API';

const enablers = [/^@hey-api\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['openapi-ts.config.@(ts|cjs|mjs)'];

const resolveConfig: ResolveConfig<PluginConfig> = async (config): Promise<Input[]> => {
  const plugins = (config.plugins ?? []).map(plugin => {
    const pluginName = typeof plugin === 'string' ? plugin : plugin.name;
    return toDeferResolve(pluginName);
  });
  const outputPath = typeof config.output === 'string' ? config.output : config.output.path;
  const ignored = [`./${outputPath}/**/*`].map(toEntry);
  return [...plugins, ...ignored];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
