import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { PluginConfig } from './types.js';

// link to docs

export const NAME = '';

/** @public */
export const ENABLERS = [''];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [];

export const ENTRY_FILE_PATTERNS = [];

export const PRODUCTION_ENTRY_FILE_PATTERNS = [];

export const PROJECT_FILE_PATTERNS = [];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: PluginConfig = configFilePath.endsWith('package.json') ? manifest.plugin : await _load(configFilePath);
  return config?.plugins ?? [];
};

export const findDependencies = timerify(findPluginDependencies);
