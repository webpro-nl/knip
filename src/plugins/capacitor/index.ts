import load from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { CapacitorConfig } from './types.js';

// https://capacitorjs.com/docs/config

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => {
  return dependencies.has('@capacitor/core') || dependencies.has('@capacitor/cli');
};

export const CONFIG_FILE_PATTERNS = ['capacitor.config.ts'];

const findCapacitorDependencies: GenericPluginCallback = async configFilePath => {
  const config: CapacitorConfig = await load(configFilePath);
  return config.includePlugins ?? [];
};

export const findDependencies = timerify(findCapacitorDependencies);
