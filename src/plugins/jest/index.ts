import { join, isInternal, toAbsolute, dirname } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { Config } from '@jest/types';

// https://jestjs.io/docs/configuration

export const NAME = 'Jest';

/** @public */
export const ENABLERS = ['jest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies, manifest }) =>
  hasDependency(dependencies, ENABLERS) || Boolean(manifest.name?.startsWith('jest-presets'));

export const CONFIG_FILE_PATTERNS = ['jest.config.{js,ts,mjs,cjs,json}', 'package.json'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const config = await load(configFilePath);
  if (config?.preset) {
    const { preset } = config;
    if (isInternal(preset)) {
      const presetConfigPath = toAbsolute(preset, dirname(configFilePath));
      const presetConfig = await resolveExtensibleConfig(presetConfigPath);
      Object.assign(config, presetConfig);
    }
  }
  return config;
};

type JestOptions = Config.InitialOptions | (() => Config.InitialOptions) | (() => Promise<Config.InitialOptions>);

const findJestDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest }) => {
  let config: JestOptions = configFilePath.endsWith('package.json')
    ? manifest.jest
    : await resolveExtensibleConfig(configFilePath);

  if (typeof config === 'function') config = await config();

  if (!config) return [];

  const replaceRootDir = (name: string) =>
    name.includes('<rootDir>') ? join(cwd, name.replace(/^.*<rootDir>/, '')) : name;

  const presets = (config.preset ? [config.preset] : []).map(preset =>
    isInternal(preset) ? preset : join(preset, 'jest-preset')
  );
  const environments = config.testEnvironment === 'jsdom' ? ['jest-environment-jsdom'] : [];
  const resolvers = config.resolver ? [config.resolver] : [];
  const reporters = config.reporters
    ? config.reporters
        .map(reporter => (typeof reporter === 'string' ? reporter : reporter[0]))
        .filter(reporter => !['default', 'github-actions', 'summary'].includes(reporter))
    : [];
  const watchPlugins =
    config.watchPlugins?.map(watchPlugin => (typeof watchPlugin === 'string' ? watchPlugin : watchPlugin[0])) ?? [];
  const setupFiles = config.setupFiles ?? [];
  const setupFilesAfterEnv = config.setupFilesAfterEnv ?? [];
  const transform = config.transform
    ? Object.values(config.transform).map(transform => (typeof transform === 'string' ? transform : transform[0]))
    : [];
  const moduleNameMapper = (config.moduleNameMapper
    ? Object.values(config.moduleNameMapper).map(mapper => (typeof mapper === 'string' ? mapper : mapper[0]))
    : [])
    .filter(value => !value.startsWith("$"));

  return [
    ...presets,
    ...environments,
    ...resolvers,
    ...reporters,
    ...watchPlugins,
    ...setupFiles,
    ...setupFilesAfterEnv,
    ...transform,
    ...moduleNameMapper,
  ].map(replaceRootDir);
};

export const findDependencies = timerify(findJestDependencies);
