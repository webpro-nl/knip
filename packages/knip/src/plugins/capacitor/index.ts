import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { CapacitorConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://capacitorjs.com/docs/config

const NAME = 'Capacitor';

const ENABLERS = [/^@capacitor\//];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['capacitor.config.ts'];

const findCapacitorDependencies: GenericPluginCallback = async (configFilePath, { isProduction }) => {
  if (isProduction) return [];

  const localConfig: CapacitorConfig | undefined = await load(configFilePath);

  if (!localConfig) return [];

  return localConfig.includePlugins ?? [];
};

const findDependencies = timerify(findCapacitorDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
