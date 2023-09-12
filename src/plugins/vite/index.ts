import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { findVitestDeps } from '../vitest/index.js';
import type { ViteConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://vitejs.dev/config/

export const NAME = 'Vite';

/** @public */
export const ENABLERS = ['vite'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vite.config.{js,ts}'];

const findViteDependencies: GenericPluginCallback = async configFilePath => {
  const config: ViteConfig = await load(configFilePath);
  return findVitestDeps(config);
};

export const findDependencies = timerify(findViteDependencies);
