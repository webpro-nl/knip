import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { findVitestDeps } from '../vitest/index.js';
import type { ViteConfig, MODE, COMMAND } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://vitejs.dev/config/

export const NAME = 'Vite';

/** @public */
export const ENABLERS = ['vite'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vite.config.{js,ts}'];

const findViteDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const localConfig: ViteConfig | undefined = await load(configFilePath);

  if (!localConfig) return [];

  if (typeof localConfig === 'function') {
    const dependencies = new Set<string>();
    for (const command of ['dev', 'serve', 'build'] as COMMAND[]) {
      for (const mode of ['development', 'production'] as MODE[]) {
        const config = await localConfig({ command, mode, ssrBuild: undefined });
        findVitestDeps(config, options).forEach(dependency => dependencies.add(dependency));
      }
    }
    return Array.from(dependencies);
  }

  return findVitestDeps(localConfig, options);
};

export const findDependencies = timerify(findViteDependencies);
