import { dirname, join, relative } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';
import type { PlaywrightTestConfig } from 'playwright/test';

// https://playwright.dev/docs/test-configuration

export const NAME = 'Playwright';

/** @public */
export const ENABLERS = ['@playwright/test'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['playwright.config.{js,ts}'];

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/*.@(spec|test).?(c|m)[jt]s?(x)'];

const toEntryPatterns = (
  testMatch: string | RegExp | Array<string | RegExp> | undefined,
  cwd: string,
  configFilePath: string,
  config: PlaywrightTestConfig
) => {
  if (!testMatch) return [];
  const dir = relative(cwd, config.testDir ? join(dirname(configFilePath), config.testDir) : dirname(configFilePath));
  const patterns = [testMatch].flat().filter((p): p is string => typeof p === 'string');
  return patterns.map(pattern => toEntryPattern(join(dir, pattern)));
};

const builtinReporters = ['dot', 'line', 'list', 'junit', 'html', 'blob', 'json', 'github'];

export const findPlaywrightDependenciesFromConfig = ({
  config,
  cwd,
  configFilePath,
  defaultPatterns,
}: {
  config: PlaywrightTestConfig;
  cwd: string;
  configFilePath: string;
  defaultPatterns: string[];
}) => {
  const projects = config.projects ? [config, ...config.projects] : [config];
  const patterns = projects.flatMap(config => toEntryPatterns(config.testMatch, cwd, configFilePath, config));
  const reporters = [config.reporter].flat().flatMap(reporter => {
    const name = typeof reporter === 'string' ? reporter : reporter?.[0];
    if (!name || builtinReporters.includes(name)) return [];
    return [name];
  });

  return [...(patterns.length > 0 ? patterns : defaultPatterns), ...reporters];
};

const findPlaywrightDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { cwd, config } = options;

  const localConfig: PlaywrightTestConfig | undefined = await load(configFilePath);

  const defaultPatterns = (config?.entry ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);

  if (localConfig) {
    return findPlaywrightDependenciesFromConfig({ cwd, configFilePath, config: localConfig, defaultPatterns });
  }

  return defaultPatterns;
};

export const findDependencies = timerify(findPlaywrightDependencies);
