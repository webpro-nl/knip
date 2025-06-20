import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDependency, toEntry, toIgnore } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://heyapi.dev/openapi-ts/get-started

const title = 'Hey API';

const enablers = ['@hey-api/openapi-ts'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['openapi-ts.config.@(js|ts|cjs|mjs)'];

const resolveConfig: ResolveConfig<PluginConfig> = async ({ plugins = [], output }): Promise<Input[]> => {
  const defaultPlugins = ['@hey-api/typescript', '@hey-api/sdk'];
  const pluginNames = plugins.reduce<string[]>((acc, p) => {
    const add = typeof p === 'string' ? [p] : (p._dependencies ?? []);
    return acc.concat(add);
  }, []);
  const pluginInputs = pluginNames.map(name =>
    defaultPlugins.includes(name) ? toIgnore(name, 'unlisted') : toDependency(name)
  );
  const outPath = typeof output === 'string' ? output : output.path;
  const entries = outPath ? [toEntry(`./${outPath}/**`)] : [];
  return [...pluginInputs, ...entries];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
