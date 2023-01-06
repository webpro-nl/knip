import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { ReleaseItConfig } from './types.js';

// https://github.com/release-it/release-it/blob/master/docs/plugins.md#using-a-plugin

export const NAME = 'Release It';

/** @public */
export const ENABLERS = ['release-it'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) =>
  ENABLERS.some(enabler => dependencies.has(enabler));

export const CONFIG_FILE_PATTERNS = [
  '.release-it.json',
  '.release-it.{js,cjs}',
  '.release-it.{yml,yaml}',
  'package.json',
];

const findReleaseItDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: ReleaseItConfig = configFilePath.endsWith('package.json')
    ? manifest['release-it']
    : await _load(configFilePath);
  return config?.plugins ? Object.keys(config.plugins) : [];
};

export const findDependencies = timerify(findReleaseItDependencies);
