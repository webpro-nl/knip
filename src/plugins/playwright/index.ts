import { dirname, join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://playwright.dev/docs/test-configuration

export const NAME = 'Playwright';

/** @public */
export const ENABLERS = ['@playwright/test'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

/** @public */
export const ENTRY_FILE_PATTERNS = ['**/*.@(spec|test).?(c|m)[jt]s?(x)'];

export const CONFIG_FILE_PATTERNS = ['playwright.config.{js,ts}'];

const findPlaywrightDependencies: GenericPluginCallback = async configFilePath => {
  const cfg = await load(configFilePath);
  const dir = cfg.testDir ? join(dirname(configFilePath), cfg.testDir) : dirname(configFilePath);
  const entryPatterns = (cfg.testMatch ? [cfg.testMatch] : ENTRY_FILE_PATTERNS).map(p => toEntryPattern(join(dir, p)));
  return entryPatterns;
};

export const findDependencies = timerify(findPlaywrightDependencies);
