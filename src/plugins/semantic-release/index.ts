import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration-file

export const NAME = 'Semantic Release';

/** @public */
export const ENABLERS = ['semantic-release'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  '.releaserc',
  '.releaserc.{yaml,yml,json,js,cjs}',
  'release.config.{js,cjs}',
  'package.json',
];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: PluginConfig = configFilePath.endsWith('package.json') ? manifest.release : await _load(configFilePath);
  const plugins = config?.plugins ?? [];
  return plugins.map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin));
};

export const findDependencies = timerify(findPluginDependencies);
