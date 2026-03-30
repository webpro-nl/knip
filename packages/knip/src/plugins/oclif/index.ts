import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { OclifConfig } from './types.ts';

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

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;
