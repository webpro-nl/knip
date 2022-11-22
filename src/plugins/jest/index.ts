import path from 'node:path';
import load from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { Config } from '@jest/types';

// https://jestjs.io/docs/configuration

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => {
  return dependencies.has('jest');
};

export const CONFIG_FILE_PATTERNS = ['jest.config.{js,ts,mjs,cjs,json}'];

export const ENTRY_FILE_PATTERNS = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const config: Config.InitialOptions = await load(configFilePath);
  if (config) {
    if (config.preset) {
      const presetConfigPath = path.join(path.dirname(configFilePath), config.preset);
      const baseConfig = await resolveExtensibleConfig(presetConfigPath);
      Object.assign(config, baseConfig);
    }
  }
  return config;
};

const findJestDependencies: GenericPluginCallback = async configFilePath => {
  if (/jest\.config/.test(configFilePath)) {
    const config: Config.InitialOptions = await resolveExtensibleConfig(configFilePath);
    if (config) {
      const environmentPackages = config.testEnvironment === 'jsdom' ? ['jest-environment-jsdom'] : [];
      const resolvers = config.resolver ? [config.resolver] : [];
      const transformPackages = config.transform
        ? Object.values(config.transform)
            .map(transform => (typeof transform === 'string' ? transform : transform[0]))
            .filter(transform => !transform.includes('<'))
        : [];
      const watchPlugins =
        config.watchPlugins?.map(watchPlugin => (typeof watchPlugin === 'string' ? watchPlugin : watchPlugin[0])) ?? [];
      return [...environmentPackages, ...transformPackages, ...resolvers, ...watchPlugins].map(getPackageName);
    }
  } else {
    // Not supported: Jest transformers
  }
  return [];
};

export const findDependencies = timerify(findJestDependencies);
