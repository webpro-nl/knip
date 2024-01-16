import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import { findPlaywrightDependenciesFromConfig } from '../playwright/index.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';
import type { PlaywrightTestConfig } from 'playwright/test';

// https://playwright.dev/docs/test-components

const NAME = 'Playwright for components';

const ENABLERS = [/^@playwright\/experimental-ct-/];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['playwright-ct.config.{js,ts}', 'playwright/index.{js,ts,jsx,tsx}'];

const ENTRY_FILE_PATTERNS = ['**/*.@(spec|test).?(c|m)[jt]s?(x)'];

const findPlaywrightCTDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { cwd, config } = options;

  const localConfig: PlaywrightTestConfig | undefined = await load(configFilePath);
  const defaultPatterns = (config?.entry ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);

  if (localConfig) {
    return findPlaywrightDependenciesFromConfig({ config: localConfig, cwd, configFilePath, defaultPatterns });
  }

  return defaultPatterns;
};

const findDependencies = timerify(findPlaywrightCTDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  ENTRY_FILE_PATTERNS,
  findDependencies,
};
