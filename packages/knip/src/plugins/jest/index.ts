import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { type Input, toDeferResolve, toEntry } from '../../util/input.js';
import { isInternal, join, toAbsolute } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getReportersDependencies, resolveExtensibleConfig } from './helpers.js';
import type { JestConfig, JestInitialOptions } from './types.js';

// https://jestjs.io/docs/configuration

const title = 'Jest';

const enablers = ['jest'];

const isEnabled: IsPluginEnabled = ({ dependencies, manifest }) =>
  hasDependency(dependencies, enablers) || Boolean(manifest.name?.startsWith('jest-presets'));

const config = ['jest.config.{js,ts,mjs,cjs,json}', 'package.json'];

const entry = ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)', '**/__mocks__/**/*.[jt]s'];

const resolveDependencies = async (config: JestInitialOptions, options: PluginOptions): Promise<Input[]> => {
  const { configFileDir } = options;

  if (config?.preset) {
    const { preset } = config;
    if (isInternal(preset)) {
      const presetConfigPath = toAbsolute(preset, configFileDir);
      const presetConfig = await resolveExtensibleConfig(presetConfigPath);
      config = Object.assign({}, presetConfig, config);
    }
  }

  const presets = (config.preset ? [config.preset] : []).map(preset =>
    isInternal(preset) ? preset : join(preset, 'jest-preset')
  );

  const projects = [];
  for (const project of config.projects ?? []) {
    if (typeof project === 'string') {
      projects.push(project);
    } else {
      const dependencies = await resolveDependencies(project, options);
      for (const dependency of dependencies) projects.push(dependency);
    }
  }

  const runner = config.runner ? [config.runner] : [];
  const runtime = config.runtime && config.runtime !== 'jest-circus' ? [config.runtime] : [];
  const environments =
    config.testEnvironment === 'jsdom'
      ? ['jest-environment-jsdom']
      : config.testEnvironment
        ? [config.testEnvironment]
        : [];
  const resolvers = config.resolver ? [config.resolver] : [];
  const reporters = getReportersDependencies(config, options);
  const watchPlugins =
    config.watchPlugins?.map(watchPlugin => (typeof watchPlugin === 'string' ? watchPlugin : watchPlugin[0])) ?? [];
  const transform = config.transform
    ? Object.values(config.transform).map(transform => (typeof transform === 'string' ? transform : transform[0]))
    : [];
  const moduleNameMapper = (
    config.moduleNameMapper
      ? Object.values(config.moduleNameMapper).map(mapper => (typeof mapper === 'string' ? mapper : mapper[0]))
      : []
  ).filter(value => !/\$[0-9]/.test(value));

  const testResultsProcessor = config.testResultsProcessor ? [config.testResultsProcessor] : [];
  const snapshotResolver = config.snapshotResolver ? [config.snapshotResolver] : [];
  const snapshotSerializers = config.snapshotSerializers ?? [];
  const testSequencer = config.testSequencer ? [config.testSequencer] : [];

  // const resolve = (specifier: string) => resolveEntry(options, specifier);
  const setupFiles = config.setupFiles ?? [];
  const setupFilesAfterEnv = config.setupFilesAfterEnv ?? [];
  const globalSetup = config.globalSetup ? [config.globalSetup] : [];
  const globalTeardown = config.globalTeardown ? [config.globalTeardown] : [];

  return [
    ...presets,
    ...projects,
    ...runner,
    ...runtime,
    ...environments,
    ...resolvers,
    ...reporters,
    ...watchPlugins,
    ...setupFiles,
    ...setupFilesAfterEnv,
    ...transform,
    ...moduleNameMapper,
    ...testResultsProcessor,
    ...snapshotResolver,
    ...snapshotSerializers,
    ...testSequencer,
    ...globalSetup,
    ...globalTeardown,
  ].map(id => (typeof id === 'string' ? toDeferResolve(id) : id));
};

const resolveEntryPaths: ResolveEntryPaths<JestConfig> = async (localConfig, options) => {
  const { configFileDir } = options;
  if (typeof localConfig === 'function') localConfig = await localConfig();
  const rootDir = localConfig.rootDir ?? configFileDir;
  const replaceRootDir = (name: string) => name.replace(/<rootDir>/, rootDir);
  return (localConfig.testMatch ?? []).map(replaceRootDir).map(toEntry);
};

const resolveConfig: ResolveConfig<JestConfig> = async (localConfig, options) => {
  const { configFileDir } = options;
  if (typeof localConfig === 'function') localConfig = await localConfig();
  const rootDir = localConfig.rootDir ?? configFileDir;
  const replaceRootDir = (name: string) => name.replace(/<rootDir>/, rootDir);

  const inputs = await resolveDependencies(localConfig, options);

  const result = inputs.map(dependency => {
    dependency.specifier = replaceRootDir(dependency.specifier);
    return dependency;
  });

  return result;
};

const args = {
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveEntryPaths,
  resolveConfig,
  args,
} satisfies Plugin;
