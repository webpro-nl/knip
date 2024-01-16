import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { findVitestDependencies } from '../vitest/index.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { ViteConfigOrFn } from '../vitest/types.js';

// https://vitejs.dev/config/

const NAME = 'Vite';

const ENABLERS = ['vite'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vite*.config.{js,mjs,ts,cjs,mts,cts}'];

const findViteDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const localConfig: ViteConfigOrFn | undefined = await load(configFilePath);

  if (!localConfig) return [];

  return findVitestDependencies(configFilePath, localConfig, options);
};

const findDependencies = timerify(findViteDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
