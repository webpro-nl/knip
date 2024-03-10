import { join, relative } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import type { IsPluginEnabled, ResolveEntryPaths, ResolveConfig } from '#p/types/plugins.js';
import type { PlaywrightTestConfig } from 'playwright/test';

// https://playwright.dev/docs/test-configuration

const title = 'Playwright';

const enablers = ['@playwright/test'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['playwright.config.{js,ts}'];

export const entry = ['**/*.@(spec|test).?(c|m)[jt]s?(x)'];

const toEntryPatterns = (
  testMatch: string | RegExp | Array<string | RegExp> | undefined,
  cwd: string,
  configDir: string,
  localConfig: PlaywrightTestConfig
) => {
  if (!testMatch) return [];
  const dir = relative(cwd, localConfig.testDir ? join(configDir, localConfig.testDir) : configDir);
  const patterns = [testMatch].flat().filter((p): p is string => typeof p === 'string');
  return patterns.map(pattern => toEntryPattern(join(dir, pattern)));
};

const builtinReporters = ['dot', 'line', 'list', 'junit', 'html', 'blob', 'json', 'github'];

export const resolveEntryPaths: ResolveEntryPaths<PlaywrightTestConfig> = async (localConfig, options) => {
  const { cwd, configFileDir } = options;
  const projects = localConfig.projects ? [localConfig, ...localConfig.projects] : [localConfig];
  return projects.flatMap(config => toEntryPatterns(config.testMatch, cwd, configFileDir, config));
};

export const resolveConfig: ResolveConfig<PlaywrightTestConfig> = async config => {
  const reporters = [config.reporter].flat().flatMap(reporter => {
    const name = typeof reporter === 'string' ? reporter : reporter?.[0];
    if (!name || builtinReporters.includes(name)) return [];
    return [name];
  });
  return [...reporters];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  resolveEntryPaths,
};
