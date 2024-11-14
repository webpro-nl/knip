import type { PluginOptions } from '../../types/config.js';
import { dirname, isInternal, join, toAbsolute } from '../../util/path.js';
import { load } from '../../util/plugin.js';
import type { JestInitialOptions } from './types.js';

export const resolveExtensibleConfig = async (configFilePath: string) => {
  let config = await load(configFilePath);
  if (config?.preset) {
    const { preset } = config;
    if (isInternal(preset)) {
      const presetConfigPath = toAbsolute(preset, dirname(configFilePath));
      const presetConfig = await resolveExtensibleConfig(presetConfigPath);
      config = Object.assign({}, presetConfig, config);
    }
  }
  return config;
};

const getStringPropOrFallback = (prop: unknown, fallback: string): string => {
  return typeof prop === 'string' ? prop : fallback;
};

export const getReportersDependencies = (config: JestInitialOptions, options: PluginOptions) => {
  // Resolve dependencies for jest-junit reporter config
  const jUnitReporterDeps: string[] = [];
  for (const reporter of config.reporters ?? []) {
    if (typeof reporter !== 'string' && reporter[0] === 'jest-junit') {
      const {
        testCasePropertiesFile,
        testCasePropertiesDirectory,
        testSuitePropertiesFile,
        testSuitePropertiesDirectory,
      } = reporter[1];

      const testCaseFileName = getStringPropOrFallback(testCasePropertiesFile, 'junitProperties.js');
      const testCaseDirectory = getStringPropOrFallback(testCasePropertiesDirectory, options.rootCwd);
      const testCaseFilePath = join(testCaseDirectory, testCaseFileName);

      const testSuiteFileName = getStringPropOrFallback(testSuitePropertiesFile, 'junitTestCaseProperties.js');
      const testSuiteDirectory = getStringPropOrFallback(testSuitePropertiesDirectory, options.rootCwd);
      const testSuiteFilePath = join(testSuiteDirectory, testSuiteFileName);

      jUnitReporterDeps.push(testCaseFilePath);
      jUnitReporterDeps.push(testSuiteFilePath);
    }
  }

  const reporters = config.reporters
    ? config.reporters
        .map(reporter => (typeof reporter === 'string' ? reporter : reporter[0]))
        .filter(reporter => !['default', 'github-actions', 'summary'].includes(reporter))
    : [];

  return [...reporters, ...jUnitReporterDeps];
};
