import path from 'node:path';
import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { Config } from '@jest/types';

// https://jestjs.io/docs/configuration

export const NAME = 'Jest';

/** @public */
export const ENABLERS = ['jest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) =>
  ENABLERS.some(enabler => dependencies.has(enabler));

export const CONFIG_FILE_PATTERNS = ['jest.config.{js,ts,mjs,cjs,json}'];

export const ENTRY_FILE_PATTERNS = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const config: Config.InitialOptions = await _load(configFilePath);
  if (config) {
    if (config.preset && config.preset.startsWith('.')) {
      const presetConfigPath = path.join(path.dirname(configFilePath), config.preset);
      const presetConfig = await resolveExtensibleConfig(presetConfigPath);
      Object.assign(config, presetConfig);
    }
  }
  return config;
};

const findJestDependencies: GenericPluginCallback = async configFilePath => {
  if (/jest\.config/.test(configFilePath)) {
    const config: Config.InitialOptions = await resolveExtensibleConfig(configFilePath);
    if (config) {
      const presets = config.preset ? [config.preset] : [];
      const environments = config.testEnvironment === 'jsdom' ? ['jest-environment-jsdom'] : [];
      const resolvers = config.resolver ? [config.resolver] : [];
      const transforms = config.transform
        ? Object.values(config.transform)
            .map(transform => (typeof transform === 'string' ? transform : transform[0]))
            .filter(transform => !transform.includes('<'))
        : [];
      const watchPlugins =
        config.watchPlugins?.map(watchPlugin => (typeof watchPlugin === 'string' ? watchPlugin : watchPlugin[0])) ?? [];
      return [...presets, ...environments, ...transforms, ...resolvers, ...watchPlugins].map(getPackageName);
    }
  }
  return [];
};

export const findDependencies = timerify(findJestDependencies);
