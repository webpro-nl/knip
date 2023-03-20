import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/commitizen/cz-cli

export const NAME = 'Commitizen';

/** @public */
export const ENABLERS = ['commitizen'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.czrc', 'package.json'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: PluginConfig = configFilePath.endsWith('package.json')
    ? manifest.config?.commitizen
    : await _load(configFilePath);
  const path = config?.path;
  return path === undefined ? [] : [path];
};

export const findDependencies = timerify(findPluginDependencies);
