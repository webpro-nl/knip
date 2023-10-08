import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file

export const NAME = 'Semantic Release';

/** @public */
export const ENABLERS = ['semantic-release'];

export const PACKAGE_JSON_PATH = 'release';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.releaserc',
  '.releaserc.{yaml,yml,json,js,cjs}',
  'release.config.{js,cjs}',
  'package.json',
];

const findSemanticReleaseDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  const config: PluginConfig = configFilePath.endsWith('package.json')
    ? manifest[PACKAGE_JSON_PATH]
    : await load(configFilePath);
  const plugins = config?.plugins ?? [];
  return plugins.map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));
};

export const findDependencies = timerify(findSemanticReleaseDependencies);
