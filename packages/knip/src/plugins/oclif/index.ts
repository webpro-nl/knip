import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import type { OclifConfig } from './types.js';

// https://oclif.io/docs/configuring_your_cli

const title = 'oclif';

const enablers: EnablerPatterns = ['oclif'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const resolveConfig: ResolveConfig<OclifConfig> = async config => {
  const plugins = config?.plugins ?? [];
  const devPlugins = config?.devPlugins ?? [];
  return [...plugins, ...devPlugins];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
