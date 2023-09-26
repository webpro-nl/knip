import { compact } from '../../util/array.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import { getEnvPackageName, getExternalReporters } from './helpers.js';
import type { VitestConfig, VitestWorkspaceConfig } from './types.js';
import type {
  IsPluginEnabledCallback,
  GenericPluginCallback,
  GenericPluginCallbackOptions,
} from '../../types/plugins.js';

// https://vitest.dev/config/

export const NAME = 'Vitest';

/** @public */
export const ENABLERS = ['vitest'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['vitest.config.ts', 'vitest.{workspace,projects}.{ts,js,json}'];

export const ENTRY_FILE_PATTERNS = ['**/*.{test,spec}.?(c|m)[jt]s?(x)'];

export const findVitestDeps = (config: VitestConfig, options: GenericPluginCallbackOptions) => {
  const { isProduction } = options;

  if (!config || !config.test) return [];

  const testConfig = config.test;

  const entryPatterns = (options.config?.entry ?? testConfig.include ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);
  if (isProduction) return entryPatterns;

  const environments = testConfig.environment ? [getEnvPackageName(testConfig.environment)] : [];
  const reporters = getExternalReporters(testConfig.reporters);
  const coverage = testConfig.coverage ? [`@vitest/coverage-${testConfig.coverage.provider ?? 'v8'}`] : [];
  const setupFiles = testConfig.setupFiles ? [testConfig.setupFiles].flat() : [];
  const globalSetup = testConfig.globalSetup ? [testConfig.globalSetup].flat() : [];
  return [...entryPatterns, ...environments, ...reporters, ...coverage, ...setupFiles, ...globalSetup];
};

const findVitestDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const config: VitestConfig | VitestWorkspaceConfig = await load(configFilePath);
  return compact([config].flat().flatMap(cfg => (!cfg || typeof cfg === 'string' ? [] : findVitestDeps(cfg, options))));
};

export const findDependencies = timerify(findVitestDependencies);
