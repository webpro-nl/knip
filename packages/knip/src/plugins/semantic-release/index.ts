import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
import type { SemanticReleaseConfig } from './types.js';

// https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file

const title = 'Semantic Release';

const enablers = ['semantic-release'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

const packageJsonPath = 'release';

const config = ['package.json', ...toCosmiconfig('release')];

const excludePackages = [
  '@semantic-release/commit-analyzer',
  '@semantic-release/github',
  '@semantic-release/npm',
  '@semantic-release/release-notes-generator',
];

const resolveConfig: ResolveConfig<SemanticReleaseConfig> = config => {
  const plugins = (config?.plugins ?? []).map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));
  return plugins.filter(plugin => !excludePackages.includes(plugin)).map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;
