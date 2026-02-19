import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toCosmiconfig } from '../../util/plugin-config.ts';
import type { SemanticReleaseConfig } from './types.ts';

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
  return plugins.filter(plugin => !excludePackages.includes(plugin)).map(id => toDeferResolve(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;
