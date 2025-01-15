import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { OclifConfig } from './types.js';

// https://oclif.io/docs/configuring_your_cli

const title = 'oclif';

const enablers = ['oclif'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const resolveConfig: ResolveConfig<OclifConfig> = async config => {
  const plugins = config?.plugins ?? [];
  const devPlugins = config?.devPlugins ?? [];
  return [...plugins, ...devPlugins].map(id => toDependency(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
