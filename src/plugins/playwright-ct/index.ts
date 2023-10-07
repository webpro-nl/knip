import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPatterns } from '../playwright/index.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://playwright.dev/docs/test-components

export const NAME = 'Playwright for components';

/** @public */
export const ENABLERS = [/^@playwright\/experimental-ct-/];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['playwright-ct.config.{js,ts}', 'playwright/index.{js,ts,jsx,tsx}'];

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/*.@(spec|test).?(c|m)[jt]s?(x)'];

const findPlaywrightCTDependencies: GenericPluginCallback = async (configFilePath, { cwd }) => {
  const config = await load(configFilePath);
  const entryPatterns = toEntryPatterns(config.testMatch, cwd, configFilePath, config);
  if (entryPatterns.length > 0) return entryPatterns;
  return toEntryPatterns(ENTRY_FILE_PATTERNS, cwd, configFilePath, config);
};

export const findDependencies = timerify(findPlaywrightCTDependencies);
