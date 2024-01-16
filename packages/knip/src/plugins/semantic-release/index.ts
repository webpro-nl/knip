import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { SemanticReleaseConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file

const NAME = 'Semantic Release';

const ENABLERS = ['semantic-release'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'release';

const CONFIG_FILE_PATTERNS = [
  '.releaserc',
  '.releaserc.{yaml,yml,json,js,cjs}',
  'release.config.{js,cjs}',
  'package.json',
];

const findSemanticReleaseDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: SemanticReleaseConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest[PACKAGE_JSON_PATH] : await load(configFilePath);

  const plugins = (localConfig?.plugins ?? []).map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));
  return plugins;
};

const findDependencies = timerify(findSemanticReleaseDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
