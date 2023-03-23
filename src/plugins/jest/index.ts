import { isAbsolute, join, dirname, isInternal } from '../../util/path.js';
import { timerify } from '../../util/performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { Config } from '@jest/types';

// https://jestjs.io/docs/configuration

export const NAME = 'Jest';

/** @public */
export const ENABLERS = ['jest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['jest.config.{js,ts,mjs,cjs,json}', 'package.json'];

const maybeJoin = (base: string, id: string) => (isAbsolute(id) ? id : join(dirname(base), id));

const resolveExtensibleConfig = async (configFilePath: string) => {
  const config: Config.InitialOptions = await load(configFilePath);
  if (config?.preset) {
    const { preset } = config;
    if (isInternal(preset)) {
      const presetConfigPath = maybeJoin(configFilePath, preset);
      const presetConfig = await resolveExtensibleConfig(presetConfigPath);
      Object.assign(config, presetConfig);
    }
  }
  return config;
};

const findJestDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest }) => {
  const config = configFilePath.endsWith('package.json')
    ? (manifest.jest as Config.InitialOptions)
    : await resolveExtensibleConfig(configFilePath);

  if (!config) return [];

  const replaceRootDir = (name: string) =>
    name.includes('<rootDir>') ? join(cwd, name.replace(/^.*<rootDir>/, '')) : name;

  const presets = (config.preset ? [config.preset] : []).map(preset =>
    isInternal(preset) ? preset : join(preset, 'jest-preset')
  );
  const environments = config.testEnvironment === 'jsdom' ? ['jest-environment-jsdom'] : [];
  const resolvers = config.resolver ? [config.resolver] : [];
  const watchPlugins =
    config.watchPlugins?.map(watchPlugin => (typeof watchPlugin === 'string' ? watchPlugin : watchPlugin[0])) ?? [];
  const setupFiles = config.setupFiles ?? [];
  const setupFilesAfterEnv = config.setupFilesAfterEnv ?? [];
  const transform = config.transform
    ? Object.values(config.transform).map(transform => (typeof transform === 'string' ? transform : transform[0]))
    : [];

  return [
    ...presets,
    ...environments,
    ...resolvers,
    ...watchPlugins,
    ...setupFiles,
    ...setupFilesAfterEnv,
    ...transform,
  ].map(replaceRootDir);
};

export const findDependencies = timerify(findJestDependencies);
