import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

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
  const config: PluginConfig = configFilePath.endsWith('package.json') ? manifest.plugin : await load(configFilePath);
  return config?.plugins ?? [];
};

export const findDependencies = timerify(findPluginDependencies);
