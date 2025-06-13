import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDependency, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://heyapi.dev/openapi-ts/get-started

const title = 'Hey API';

const enablers = ['@hey-api/openapi-ts'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['openapi-ts.config.@(js|ts|cjs|mjs)'];

const resolveConfig: ResolveConfig<PluginConfig> = async (config): Promise<Input[]> => {
  const plugins = (config.plugins ?? []).reduce<Input[]>((acc, plugin) => {
    if (typeof plugin === 'string') {
      acc.push(toDependency(plugin));
      return acc;
    }

    const dependencies = plugin._dependencies ?? [];

    for (const dep of dependencies) {
      acc.push(toDependency(dep));
    }

    return acc;
  }, []);
  const outputPath = typeof config.output === 'string' ? config.output : config.output.path;
  const entries = outputPath ? [toEntry(`./${outputPath}/**`)] : [];
  return [...plugins, ...entries];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
