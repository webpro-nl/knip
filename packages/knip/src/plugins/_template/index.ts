import { hasDependency } from '#p/util/plugin.js';
import type { IgnorePatterns } from '#p/types/config.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';
import type { PluginConfig } from './types.js';

// link to __PLUGIN_NAME__ docs

const title = '_template';

const enablers: IgnorePatterns = ['_template'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = [];

const entry: string[] = [];

const production: string[] = [];

const resolveConfig: ResolveConfig<PluginConfig> = async config => {
  const dependencies = config?.plugins ?? [];
  return [...dependencies];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveConfig,
};
