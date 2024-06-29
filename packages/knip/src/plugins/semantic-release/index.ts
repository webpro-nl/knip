import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency, toCosmiconfig } from '#p/util/plugin.js';
import type { SemanticReleaseConfig } from './types.js';

// https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file

const title = 'Semantic Release';

const enablers = ['semantic-release'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'release';

const config = ['package.json', ...toCosmiconfig('release')];

const resolveConfig: ResolveConfig<SemanticReleaseConfig> = config => {
  const plugins = (config?.plugins ?? []).map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));
  return plugins;
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
