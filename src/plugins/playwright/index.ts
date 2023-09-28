import { compact } from '../../util/array.js';
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

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/*.@(spec|test).?(c|m)[jt]s?(x)'];

export const CONFIG_FILE_PATTERNS = ['playwright.config.{js,ts}'];

const findProjectDependencies = (cwd: string, configFilePath: string, config: PlaywrightTestConfig) => {
  const dir = relative(cwd, config.testDir ? join(dirname(configFilePath), config.testDir) : dirname(configFilePath));
  const entryPatterns = (config.testMatch ? [config.testMatch] : ENTRY_FILE_PATTERNS).flatMap(pattern =>
    [pattern].flat().flatMap(pattern => (typeof pattern === 'string' ? toEntryPattern(join(dir, pattern)) : []))
  );
  return entryPatterns;
};

const findPlaywrightDependencies: GenericPluginCallback = async (configFilePath, { cwd }) => {
  const config: PlaywrightTestConfig = await load(configFilePath);
  const projects = config.projects ? config.projects : [config];
  return compact(projects.flatMap(project => findProjectDependencies(cwd, configFilePath, project)));
};

export const findDependencies = timerify(findPlaywrightDependencies);
