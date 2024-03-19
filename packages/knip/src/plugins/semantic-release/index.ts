import { hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { SemanticReleaseConfig } from './types.js';

// https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file

const title = 'Semantic Release';

const enablers = ['semantic-release'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'release';

const config = ['.releaserc', '.releaserc.{yaml,yml,json,js,cjs}', 'release.config.{js,cjs}', 'package.json'];

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
} as const;
