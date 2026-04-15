import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { PluginConfig } from './types.ts';

// link to __PLUGIN_NAME__ docs

const title = '__PLUGIN_NAME__';

const enablers = ['__PLUGIN_NAME__'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = [];

const entry: string[] = [];

const production: string[] = [];

const resolveConfig: ResolveConfig<PluginConfig> = async config => {
  const inputs = config?.plugins ?? [];
  return [...inputs].map(id => toDeferResolve(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveConfig,
};

export default plugin;
